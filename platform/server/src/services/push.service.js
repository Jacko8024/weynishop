import { getFirebaseAdmin } from '../config/firebase.js';
import { DeviceToken } from '../models/DeviceToken.js';
import { Notification } from '../models/Notification.js';

/**
 * Push notification service (mobile app only).
 *
 * Sends FCM data messages to all registered devices of a user via
 * firebase-admin. The Android app (Capacitor PushNotifications plugin)
 * receives them and shows a system notification, then optionally routes
 * to the right screen via the `push:received` / `push:tapped` events.
 *
 * All functions are fire-and-forget safe: they never throw to the caller
 * (push failures must not break order flows). Prunes tokens that FCM
 * reports as unregistered/invalid.
 */

const log = (...args) => console.log('[push]', ...args);

const UNREGISTERED_CODES = {
    'messaging/registration-token-not-registered': true,
    'messaging/invalid-registration-token': true,
    'messaging/invalid-argument': true,
};

/** Delete tokens FCM rejected as dead (app uninstalled / token rotated). */
const pruneInvalid = (results) => {
    const dead = (results || []).filter((r) => r.error && UNREGISTERED_CODES[r.error.code]);
    return Promise.all(
        dead.map((r) =>
            DeviceToken.destroy({ where: { token: r.token } }).catch(() => { })
        )
    );
};


/**
 * Push a notification to every device of one user AND store it as an
 * in-app notification row (Account ▸ Notifications shows real dispatched
 * events only — no fake data).
 * @param {number} userId
 * @param {{title:string, body:string, data?:object}} payload
 */
export const pushToUser = async (userId, { title, body, data = {} }) => {
    // Persist first so the in-app list exists even when FCM is not
    // configured (e.g. dev without service-account credentials).
    persistNotification(userId, { title, body, data });

    const admin = getFirebaseAdmin();
    if (!admin) return log('skipped (admin SDK not configured) —', title);

    const tokens = await DeviceToken.findAll({ where: { userId } }).catch(() => []);
    if (!tokens.length) return; // user has no mobile devices registered

    const message = {
        // Send to all tokens at once; FCM handles per-token fan-out.
        tokens: tokens.map((t) => t.token),
        // Data payload: delivered to the app even in background/killed state,
        // and the plugin turns it into a visible system notification.
        data: {
            title: String(title),
            body: String(body),
            // FCM data values must be strings — stringify the extras.
            ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        },
        // Android channel the plugin creates at init ("fcm_default_fallback_channel"
        // is used unless the app defines custom channels).
        android: { priority: 'high' },
    };

    try {
        const res = await admin.messaging().sendEachForMulticast(message);
        // Refresh lastSeenAt for tokens that succeeded.
        const okTokens = tokens.filter((t) => {
            const idx = message.tokens.indexOf(t.token);
            return res.responses[idx]?.success;
        });
        if (okTokens.length) {
            DeviceToken.update(
                { lastSeenAt: new Date() },
                { where: { token: okTokens.map((t) => t.token) } }
            ).catch(() => { });
        }
        await pruneInvalid(
            res.responses.map((r, i) => ({ ...r, token: message.tokens[i] }))
        );
        log(`→ user ${userId}: ${res.successCount}/${message.tokens.length} delivered ("${title}")`);
    } catch (err) {
        log('send failed:', err.message);
    }
};

/** Store the notification row (link drives the in-app deep link on tap). */
const LINK_BY_TYPE = {
    'order:new': (d) => `/seller/orders?order=${d.orderId}`,
    'order:stage': (d) => `/buyer/orders/${d.orderId}`,
    'delivery:assigned': (d) => `/delivery/active?order=${d.orderId}`,
    'order:delivered': (d) => `/seller/orders?order=${d.orderId}`,
    'order:cancelled': (d) => `/seller/orders?order=${d.orderId}`,
};
const persistNotification = (userId, { title, body, data = {} }) => {
    const link = LINK_BY_TYPE[data.type]?.(data) || '';
    Notification.create({
        userId,
        type: String(data.type || 'general'),
        title: String(title).slice(0, 160),
        body: String(body).slice(0, 500),
        link,
    }).catch((e) => log('persist failed:', e.message));
};

/* ------------------------------------------------------------------ */
/* Ready-made notification templates per marketplace event            */
/* ------------------------------------------------------------------ */

export const notifyOrderPlaced = (order) =>
    pushToUser(order.sellerId, {
        title: 'New order received 🎉',
        body: `Order #${order.id}: ${itemSummary(order)}. Tap to accept.`,
        data: { type: 'order:new', orderId: String(order.id) },
    }).catch(() => { });

export const notifyStage = (order, stage) => {
    const tpl = STAGE_MESSAGES.buyer[stage];
    if (!tpl) return; // stages the buyer doesn't need to hear about
    // No seller/delivery pushes on generic stage transitions — they get their
    // own specific notifications at assignment / delivered points below.
    const fill = (s) => String(s).split('{id}').join(order.id);
    pushToUser(order.buyerId, {
        title: fill(tpl.title),
        body: fill(tpl.body),
        data: { type: 'order:stage', orderId: String(order.id), stage },
    }).catch(() => { });
};

export const notifyAssigned = (order, deliveryUserId) =>
    pushToUser(deliveryUserId, {
        title: 'New delivery assigned 🛵',
        body: `Order #${order.id} — pick up from ${order.pickupAddress || 'seller'} and deliver to ${order.deliveryAddress || 'buyer'}.`,
        data: { type: 'delivery:assigned', orderId: String(order.id) },
    }).catch(() => { });

export const notifyDelivered = (order) =>
    pushToUser(order.sellerId, {
        title: 'Order delivered ✅',
        body: `Order #${order.id} was delivered and paid. Earnings credited to your wallet.`,
        data: { type: 'order:delivered', orderId: String(order.id) },
    }).catch(() => { });

export const notifyCancelled = (order) =>
    pushToUser(order.sellerId, {
        title: 'Order cancelled',
        body: `Order #${order.id} was cancelled by the buyer.`,
        data: { type: 'order:cancelled', orderId: String(order.id) },
    }).catch(() => { });

/* helpers */

const itemSummary = (order) => {
    const items = order.items || [];
    if (!items.length) return 'new order';
    const first = items[0].name || 'item';
    return items.length === 1 ? first : `${first} +${items.length - 1} more`;
};

// Buyer-facing copy per stage. Keys match the STAGES constant in Order.js.
const STAGE_MESSAGES = {
    buyer: {
        preparing: { title: 'Order accepted 👨‍🍳', body: 'Order #{id} is being prepared.' },
        ready_for_pickup: { title: 'Ready for pickup 📦', body: 'Order #{id} is packed and waiting for the courier.' },
        picked_up: { title: 'Courier on the way 🛵', body: 'Order #{id} has been picked up from the seller.' },
        out_for_delivery: { title: 'Out for delivery 🚴', body: 'Order #{id} will arrive soon.' },
        delivered_paid: { title: 'Delivered — enjoy! 🎉', body: 'Order #{id} was delivered. Payment received.' },
    },
};

// Exposed for tests / debugging.
export const __testStageMessages = STAGE_MESSAGES;
