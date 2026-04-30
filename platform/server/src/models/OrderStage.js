import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { STAGES } from './Order.js';

export const OrderStage = sequelize.define(
  'OrderStage',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    stage: { type: DataTypes.ENUM(...STAGES), allowNull: false },
    at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    note: { type: DataTypes.STRING(255), defaultValue: '' },
  },
  { tableName: 'order_stages', timestamps: false, indexes: [{ fields: ['orderId'] }] }
);

