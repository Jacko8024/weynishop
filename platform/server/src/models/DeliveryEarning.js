import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * One row per delivery-fee credit earned by a courier. Created automatically
 * when an order transitions to 'delivered_paid'. Kept independently of
 * CommissionLedger so the courier wallet stays clean and easy to reconcile.
 *
 * Idempotency: a UNIQUE index on (orderId, type) prevents accidental
 * double-credits if a status transition fires twice.
 */
export const DeliveryEarning = sequelize.define(
  'DeliveryEarning',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deliveryPersonId: { type: DataTypes.INTEGER, allowNull: false },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(8), defaultValue: 'ETB' },
    type: {
      type: DataTypes.ENUM('delivery_fee', 'reversal', 'adjustment'),
      defaultValue: 'delivery_fee',
    },
    status: { type: DataTypes.ENUM('credited', 'paid_out', 'reversed'), defaultValue: 'credited' },
    note: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: 'delivery_earnings',
    indexes: [
      { fields: ['deliveryPersonId'] },
      { fields: ['orderId'] },
      { fields: ['createdAt'] },
      { unique: true, fields: ['orderId', 'type'] },
    ],
  }
);

DeliveryEarning.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  v.amount = Number(v.amount);
  return v;
};
