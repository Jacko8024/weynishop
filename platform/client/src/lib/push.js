import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { api } from '../api/client.js';

/**
 * Push notifications — MOBILE APP ONLY.
 *
 * On the web (browser) this module is a complete no-op: registerPush()
 * returns before touching any plugin, so the website never asks for
 * notification permission and never registers a device token.
 *
 * On Android/iOS (Capacitor native build) it:
 *   1. Asks the user for notification permission
 *   2. Gets the FCM device token from Firebase
 *   3. Registers it with the API (POST /api/v1/notifications/devices)
 *      so the server can push order updates to this phone
 *   4. Re-registers on token refresh
 *
 * Tap routing: when the user taps a notification, we navigate based on
 * the data payload (type + orderId) using the router instance captured
 * by setPushRouter(). Falls back to a plain window location change.
 */

let routerRef = null;
export const setPushRouter = (r) => { routerRef = r; };

const routeFor = (data) => {
    if (!data?.type) return null;
    if (data.type.startsWith('order:')) {
        // Buyers track orders at /buyer/orders/:id.
        return `/buyer/orders/${data.orderId}`;
    }
    if (data.type === 'delivery:assigned') return '/delivery/active';
    return null;
};

const handleTap = (data) => {
    const path = routeFor(data);
    if (!path) return;
    if (routerRef?.navigate) routerRef.navigate(path);
    else window.location.assign(path);
};

// Register listeners exactly once even if registerPush is called twice
// (e.g. strict-mode double-mount or login + app-start calls).
let listenersBound = false;
const bindListeners = () => {
    if (listenersBound) return;
    listenersBound = true;

    PushNotifications.addListener('registration', (tok) => {
        // Send to server; best-effort — retried on next app start.
        api
            .post('/notifications/devices', { token: tok.value, platform: Capacitor.getPlatform() })
            .catch((e) => console.warn('[push] token register failed:', e?.message));
    });

    // FCM rotates tokens occasionally — keep the server's copy fresh.
    PushNotifications.addListener('registrationError', (err) => {
        console.error('[push] registration error:', err);
    });

    // App is open + foreground: the plugin does NOT auto-show data
    // messages, so surface them as an in-app toast + optional navigation.
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
        // Let the app's global toast system show it if mounted; silent otherwise.
        const evt = new CustomEvent('weynishop:push', { detail: notification });
        window.dispatchEvent(evt);
    });

    // User tapped a notification (app was backgrounded/killed).
    PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
        handleTap(event.notification?.data);
    });
};

export const registerPush = async () => {
    // WEB GUARD: everything below is native-only. On a desktop/mobile
    // browser Capacitor.isNativePlatform() is false and we bail out here.
    if (!Capacitor.isNativePlatform()) return false;

    try {
        bindListeners();

        let status = await PushNotifications.checkPermissions();
        if (status.receive === 'prompt') {
            status = await PushNotifications.requestPermissions();
        }
        if (status.receive !== 'granted') {
            console.log('[push] permission not granted — notifications disabled');
            return false;
        }

        // Idempotent: registering again when already registered is a no-op
        // that simply re-fires 'registration' with the current token.
        await PushNotifications.register();
        return true;
    } catch (err) {
        console.warn('[push] init failed:', err?.message);
        return false;
    }
};

// Logout companion: detach this device from the user's account so they
// stop receiving order pushes after signing out.
export const unregisterPush = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        const tok = await PushNotifications.getToken();
        if (tok) await api.delete(`/notifications/devices/${encodeURIComponent(tok)}`).catch(() => { });
    } catch { /* plugin unavailable or no token yet — ignore */ }
};
