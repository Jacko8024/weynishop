import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';

export const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    phone: { type: DataTypes.STRING(40), defaultValue: '' },
    password: { type: DataTypes.STRING(120), allowNull: false },
    // Firebase Auth linkage (Google sign-in). Null for password-only accounts.
    firebaseUid: { type: DataTypes.STRING(128), allowNull: true, unique: true },
    photoUrl: { type: DataTypes.STRING(500), defaultValue: '' },
    role: { type: DataTypes.ENUM('buyer', 'seller', 'delivery', 'admin'), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'active', 'suspended'), defaultValue: 'active' },
    flagged: { type: DataTypes.BOOLEAN, defaultValue: false },

    shopName: { type: DataTypes.STRING(160), defaultValue: '' },

    pickupLat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    pickupLng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    pickupAddress: { type: DataTypes.STRING(255), defaultValue: '' },

    defaultLat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    defaultLng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    defaultAddress: { type: DataTypes.STRING(255), defaultValue: '' },

    currentLat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    currentLng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },

    isOnline: { type: DataTypes.BOOLEAN, defaultValue: false },
    activeOrderId: { type: DataTypes.INTEGER, allowNull: true },

    // Marketplace fields
    verified: { type: DataTypes.BOOLEAN, defaultValue: false }, // verified seller badge
    followerCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    storeBanner: { type: DataTypes.STRING(1000), defaultValue: '' },
    storeDescription: { type: DataTypes.TEXT },
    locale: { type: DataTypes.STRING(8), defaultValue: 'en' },
  },
  {
    tableName: 'users',
    hooks: {
      beforeCreate: async (u) => {
        if (u.password) u.password = await bcrypt.hash(u.password, 10);
      },
      beforeUpdate: async (u) => {
        if (u.changed('password')) u.password = await bcrypt.hash(u.password, 10);
      },
    },
  }
);

User.prototype.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Normalize JSON output: add _id (string) for frontend compatibility,
// expose pickupLocation / defaultAddress / currentLocation as nested objects,
// strip password.
User.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  delete v.password;

  const pickupCoords = (v.pickupLng != null && v.pickupLat != null)
    ? [Number(v.pickupLng), Number(v.pickupLat)]
    : null;
  v.pickupLocation = pickupCoords
    ? { type: 'Point', coordinates: pickupCoords, address: v.pickupAddress || '' }
    : null;

  const defCoords = (v.defaultLng != null && v.defaultLat != null)
    ? [Number(v.defaultLng), Number(v.defaultLat)]
    : null;
  // Frontend expects user.defaultAddress.coordinates / .address
  v.defaultAddress = defCoords
    ? { type: 'Point', coordinates: defCoords, address: v.defaultAddress || '' }
    : null;

  const curCoords = (v.currentLng != null && v.currentLat != null)
    ? [Number(v.currentLng), Number(v.currentLat)]
    : null;
  v.currentLocation = curCoords
    ? { type: 'Point', coordinates: curCoords, address: '' }
    : null;

  return v;
};

