import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { DeviceToken } from '../models/DeviceToken.js';
import { protect } from '../middleware/auth.js';

// Device-token registry for PUSH NOTIFICATIONS (mobile app only).
// The web client never calls these — the Capacitor app registers its FCM
// token after login so the server can push order updates to the phone.

const router = Router();

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

export default router;
