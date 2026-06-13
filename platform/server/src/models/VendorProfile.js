import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const VendorProfile = sequelize.define(
  'VendorProfile',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    ownerName: { type: DataTypes.STRING(160), allowNull: false },
    shopCategory: { type: DataTypes.STRING(80), allowNull: false },
    phoneNumber: { type: DataTypes.STRING(40), allowNull: false },
    tinOrLicenseUrl: { type: DataTypes.STRING(1000), defaultValue: '' },
    shopPhotoUrl: { type: DataTypes.STRING(1000), defaultValue: '' },
    latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    bankName: { type: DataTypes.STRING(120), defaultValue: '' },
    accountNumber: { type: DataTypes.STRING(60), defaultValue: '' },
    agreedToTerms: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'vendor_profiles',
    indexes: [{ fields: ['userId'] }],
  }
);

VendorProfile.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  return v;
};
