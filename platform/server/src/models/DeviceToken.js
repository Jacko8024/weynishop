import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// FCM device tokens for PUSH NOTIFICATIONS (mobile app only).
// A user can have many devices (phone + tablet); each device registers its
// token after login. Tokens are pruned automatically when FCM reports them
// as invalid (app uninstalled, token rotated).
export const DeviceToken = sequelize.define(
    'DeviceToken',
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER, allowNull: false },
        // FCM registration token (long string, ~150-200 chars)
        token: { type: DataTypes.STRING(512), allowNull: false },
        // 'android' | 'ios' — helps debugging / future per-platform payloads
        platform: { type: DataTypes.STRING(16), defaultValue: 'android' },
        // Last time a push actually succeeded for this token (UTC).
        lastSeenAt: { type: DataTypes.DATE },
    },
    {
        tableName: 'device_tokens',
        indexes: [
            // Fast lookup: all tokens for a user. Unique on token prevents dupes
            // when the same device re-registers (upsert-style via findOrCreate).
            { unique: true, fields: ['token'] },
            { fields: ['userId'] },
        ],
    }
);
