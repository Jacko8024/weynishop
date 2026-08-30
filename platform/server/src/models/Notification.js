import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * Stored in-app notification (Phase 7 — real data only, no fakes).
 *
 * Rows are created by push.service.js at the same moment an FCM push is
 * sent, so the in-app Notifications screen always mirrors what the server
 * actually dispatched (order events, delivery assignments, etc.).
 */
export const Notification = sequelize.define(
    'Notification',
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        userId: { type: DataTypes.INTEGER, allowNull: false, index: true },
        // Machine type e.g. order:new, order:stage, delivery:assigned
        type: { type: DataTypes.STRING(40), defaultValue: 'general' },
        title: { type: DataTypes.STRING(160), allowNull: false },
        body: { type: DataTypes.STRING(500), defaultValue: '' },
        // Deep-link target inside the app (validated client-side by prefix '/')
        link: { type: DataTypes.STRING(255), defaultValue: '' },
        readAt: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        tableName: 'notifications',
        updatedAt: false,
        indexes: [{ fields: ['userId', 'createdAt'] }],
    }
);

Notification.prototype.toJSON = function () {
    const v = { ...this.get() };
    v._id = String(v.id);
    v.read = v.readAt != null;
    return v;
};
