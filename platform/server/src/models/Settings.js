import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Settings = sequelize.define(
  'Settings',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    deliveryRadiusKm: { type: DataTypes.INTEGER, defaultValue: 10 },
    commissionPercent: { type: DataTypes.INTEGER, defaultValue: 0 },
    flatDeliveryFee: { type: DataTypes.DECIMAL(12, 2), defaultValue: 50 },

    // Per-listing commission charged to sellers when they publish a product.
    // Type 'fixed' = flat ETB per listing, 'percentage' = % of product price.
    listingCommissionType: { type: DataTypes.ENUM('fixed', 'percentage'), defaultValue: 'fixed' },
    listingCommissionValue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    commissionCurrency: { type: DataTypes.STRING(8), defaultValue: 'ETB' },
    notificationTemplates: {
      type: DataTypes.JSON,
      defaultValue: {
        orderPlaced: 'Your order #{orderId} has been placed.',
        outForDelivery: 'Your order #{orderId} is out for delivery.',
        delivered: 'Your order #{orderId} was delivered. Thank you!',
      },
    },
  },
  { tableName: 'settings' }
);

Settings.getSingleton = async function () {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  return s;
};
