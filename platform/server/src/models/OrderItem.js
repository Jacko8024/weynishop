import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    image: { type: DataTypes.STRING(1000), defaultValue: '' },
  },
  { tableName: 'order_items', timestamps: false, indexes: [{ fields: ['orderId'] }] }
);

OrderItem.prototype.toJSON = function () {
  const v = { ...this.get() };
  v.product = String(v.productId);
  v.price = Number(v.price);
  return v;
};
