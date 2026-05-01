import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    image: { type: DataTypes.STRING(1000), defaultValue: '' },

    // Snapshot of seller economics at the moment the order was placed. Locked
    // in so that any later change to product price or platform commission
    // settings does NOT retroactively alter what was billed for this sale.
    basePriceSnapshot:        { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    commissionPercentSnapshot:{ type: DataTypes.DECIMAL(6, 2),  allowNull: true },
    commissionAmountSnapshot: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  },
  { tableName: 'order_items', timestamps: false, indexes: [{ fields: ['orderId'] }] }
);

OrderItem.prototype.toJSON = function () {
  const v = { ...this.get() };
  v.product = String(v.productId);
  v.price = Number(v.price);
  return v;
};

