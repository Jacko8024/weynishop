import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const DeliveryAssignment = sequelize.define(
  'DeliveryAssignment',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
    deliveryPersonId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    acceptedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    cashCollected: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  },
  { tableName: 'delivery_assignments' }
);
