import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const SURPRISE_STATUSES = ['new', 'contacted', 'done'];

export const SurpriseBooking = sequelize.define(
  'SurpriseBooking',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    serviceId: { type: DataTypes.INTEGER, allowNull: true },
    providerId: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(40), allowNull: false },
    email: { type: DataTypes.STRING(180), defaultValue: '' },
    serviceType: { type: DataTypes.STRING(60), defaultValue: 'birthday' },
    provider: { type: DataTypes.STRING(160), defaultValue: '' },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    surpriseDate: { type: DataTypes.STRING(40), defaultValue: '' },
    city: { type: DataTypes.STRING(120), defaultValue: 'Beirut' },
    notes: { type: DataTypes.TEXT, defaultValue: '' },
    extras: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
    status: { type: DataTypes.ENUM(...SURPRISE_STATUSES), defaultValue: 'new' },
    adminNote: { type: DataTypes.TEXT, defaultValue: '' },
  },
  {
    tableName: 'surprise_bookings',
    indexes: [{ fields: ['status'] }, { fields: ['serviceId'] }, { fields: ['providerId'] }],
  }
);

export default SurpriseBooking;