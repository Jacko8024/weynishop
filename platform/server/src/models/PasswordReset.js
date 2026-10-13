import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const PasswordReset = sequelize.define(
  'PasswordReset',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(180), allowNull: false, index: true },
    otp: { type: DataTypes.STRING(10), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    used: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'password_resets',
    updatedAt: false,
    indexes: [{ fields: ['email', 'otp'] }],
  }
);
