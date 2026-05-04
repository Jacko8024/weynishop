import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const DeliveryAssignment = sequelize.define(
  'DeliveryAssignment',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    deliveryPersonId: { type: DataTypes.INTEGER, allowNull: false },
    acceptedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    cashCollected: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  },
  { tableName: 'delivery_assignments' }
);

