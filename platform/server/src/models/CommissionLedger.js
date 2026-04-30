import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * One row per commission charge against a seller.
 * Currently the only `type` is 'listing_fee' (charged when a seller
 * publishes a new product), but the schema is generic so future
 * commission types (e.g. 'sale_commission') can be added without migration.
 */
export const CommissionLedger = sequelize.define(
  'CommissionLedger',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    sellerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    productName: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(8), defaultValue: 'ETB' },
    type: {
      type: DataTypes.ENUM('listing_fee', 'sale_commission', 'adjustment'),
      defaultValue: 'listing_fee',
    },
    status: { type: DataTypes.ENUM('pending', 'paid'), defaultValue: 'pending' },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    note: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: 'commission_ledger',
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['createdAt'] },
    ],
  }
);

CommissionLedger.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  v.amount = Number(v.amount);
  return v;
};
