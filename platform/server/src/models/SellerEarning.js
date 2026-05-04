import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

/**
 * One row per net-earnings credit for a seller. Created when an order is
 * confirmed paid (delivered_paid). Stores gross / commission / net so the
 * seller dashboard can show a transparent breakdown without having to
 * recompute from order items each time.
 */
export const SellerEarning = sequelize.define(
  'SellerEarning',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sellerId: { type: DataTypes.INTEGER, allowNull: false },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    gross: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    commission: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    net: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(8), defaultValue: 'ETB' },
    type: {
      type: DataTypes.ENUM('sale', 'reversal', 'adjustment'),
      defaultValue: 'sale',
    },
    status: { type: DataTypes.ENUM('credited', 'paid_out', 'reversed'), defaultValue: 'credited' },
    note: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    tableName: 'seller_earnings',
    indexes: [
      { fields: ['sellerId'] },
      { fields: ['orderId'] },
      { fields: ['createdAt'] },
      { unique: true, fields: ['orderId', 'type'] },
    ],
  }
);

SellerEarning.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  v.gross = Number(v.gross);
  v.commission = Number(v.commission);
  v.net = Number(v.net);
  return v;
};
