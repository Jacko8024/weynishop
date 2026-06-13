import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const DeliveryProfile = sequelize.define(
  'DeliveryProfile',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING(160), allowNull: false },
    profilePhotoUrl: { type: DataTypes.STRING(1000), defaultValue: '' },
    vehicleType: { type: DataTypes.ENUM('cycle', 'motor', 'car'), allowNull: false },
    plateNumber: { type: DataTypes.STRING(40), defaultValue: '' },
    licenseOrIdUrl: { type: DataTypes.STRING(1000), defaultValue: '' },
    guarantorName: { type: DataTypes.STRING(160), allowNull: false },
    guarantorPhone: { type: DataTypes.STRING(40), allowNull: false },
    guarantorAddress: { type: DataTypes.STRING(255), defaultValue: '' },
    phoneNumber: { type: DataTypes.STRING(40), allowNull: false },
    agreedToTerms: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'delivery_profiles',
    indexes: [{ fields: ['userId'] }],
  }
);

DeliveryProfile.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  return v;
};
