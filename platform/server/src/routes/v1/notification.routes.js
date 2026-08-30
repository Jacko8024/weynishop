import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { DeviceToken } from '../../models/DeviceToken.js';
import { Notification } from '../../models/Notification.js';
import { protect } from '../../middleware/auth.js';

// Device-token registry for PUSH NOTIFICATIONS (mobile app only) +
// stored in-app notifications (Phase 7 — real dispatched events only).

const router = Router();

/* ------------------------------------------------------------------ */
/* Device tokens (FCM)                                                 */
/* ------------------------------------------------------------------ */

// Register (or refresh) this device's FCM token for the logged-in user.
// Called by the mobile app on startup and whenever FCM rotates the token.
router.post(
    '/devices',
    protect,
    asyncHandler(async (req, res) => {
        const { token, platform } = req.body || {};
        if (!token || typeof token !== 'string' || token.length > 512)
            return res.status(400).json({ message: 'token required (max 512 chars)' });

        // Same token may re-register for a different user after account switch:
        // upsert keeps one row per token, owned by the latest logged-in user.
        const [row] = await DeviceToken.upsert({
            token,
            userId: req.user.id,
            platform: platform === 'ios' ? 'ios' : 'android',
            lastSeenAt: new Date(),
        });

        // Drop any other rows still pointing this user at stale tokens? No —
        // multiple devices per user are allowed. Only one row per token exists.
        res.status(201).json({ ok: true, id: row?.id });
    })
);

// Remove this device (called on logout / notification opt-out in the app).
router.delete(
    '/devices/:token',
    protect,
    asyncHandler(async (req, res) => {
        const n = await DeviceToken.destroy({
            where: { token: req.params.token, userId: req.user.id },
        });
        res.json({ ok: true, removed: n });
    })
);

// List the current user's registered devices (for an in-app "devices" screen).
router.get(
    '/devices',
    protect,
    asyncHandler(async (_req, res) => {
        const devices = await DeviceToken.findAll({
            where: { userId: _req.user.id },
            attributes: ['id', 'platform', 'lastSeenAt', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });
        res.json({ devices });
    })
);

/* ------------------------------------------------------------------ */
/* Stored in-app notifications (Account ▸ Notifications)               */
/* ------------------------------------------------------------------ */

// Paginated list — newest first. `?unread=1` filters to unread only.
router.get(
    '/',
    protect,
    asyncHandler(async (req, res) => {
        const limit = Math.min(parseInt(req.query.limit, 10) || 30, 50);
        const beforeId = parseInt(req.query.before, 10) || null;
        const where = { userId: req.user.id };
        if (req.query.unread === '1') where.readAt = null;
        if (beforeId) where.id = { [Op.lt]: beforeId };

        const notifications = await Notification.findAll({
            where,
            order: [['id', 'DESC']],
            limit,
        });
        const unreadCount = await Notification.count({
            where: { userId: req.user.id, readAt: null },
        });
        res.json({ notifications, unreadCount });
    })
);

// Unread badge count (cheap poll for the Account screen).
router.get(
    '/unread-count',
    protect,
    asyncHandler(async (req, res) => {
        const unreadCount = await Notification.count({
            where: { userId: req.user.id, readAt: null },
        });
        res.json({ unreadCount });
    })
);

// Mark one notification read.
router.put(
    '/:id/read',
    protect,
    asyncHandler(async (req, res) => {
        const n = await Notification.findOne({
            where: { id: req.params.id, userId: req.user.id },
        });
        if (n && !n.readAt) {
            n.readAt = new Date();
            await n.save();
        }
        res.json({ ok: true, notification: n });
    })
);

// Mark everything read.
router.put(
    '/read-all',
    protect,
    asyncHandler(async (req, res) => {
        await Notification.update(
            { readAt: new Date() },
            { where: { userId: req.user.id, readAt: null } }
        );
        res.json({ ok: true });
    })
);

export default router;
