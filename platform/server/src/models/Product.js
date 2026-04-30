import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    sellerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    stock: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    category: { type: DataTypes.STRING(80), defaultValue: 'general' },
    image: { type: DataTypes.STRING(1000), defaultValue: '' },
    images: { type: DataTypes.JSON, defaultValue: [] }, // array of URLs
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },

    // Flash sale
    flashSaleStart: { type: DataTypes.DATE, allowNull: true },
    flashSaleEnd: { type: DataTypes.DATE, allowNull: true },
    flashSalePercent: { type: DataTypes.DECIMAL(5, 2), allowNull: true }, // e.g. 25.00 = 25%

    // Bulk pricing tiers: [{ minQty: 10, price: 180 }, { minQty: 50, price: 150 }]
    bulkPriceTiers: { type: DataTypes.JSON, defaultValue: [] },

    // Stats (denormalised for fast listings)
    soldCount: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    ratingAvg: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 }, // 0.00 – 5.00
    ratingCount: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    freeShipping: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: 'products',
    indexes: [
      { fields: ['category'] },
      { fields: ['sellerId'] },
      { fields: ['soldCount'] },
      { fields: ['ratingAvg'] },
    ],
  }
);

// Some MySQL driver/version combos return JSON columns as raw strings
// instead of parsed values. Normalise here so consumers always get arrays.
const safeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  return [];
};

Product.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);

  // Normalise images: prefer the JSON array (parsed), fall back to legacy single-image field
  let imgs = safeArray(v.images).filter(Boolean);
  if (!imgs.length && v.image) imgs = [v.image];
  v.images = imgs;

  // Normalise bulk pricing tiers (also JSON column)
  v.bulkPriceTiers = safeArray(v.bulkPriceTiers)
    .filter((t) => t && typeof t === 'object')
    .map((t) => ({ minQty: Number(t.minQty) || 0, price: Number(t.price) || 0 }))
    .filter((t) => t.minQty > 0 && t.price > 0);

  // Numeric coercion (Sequelize DECIMAL → string by default)
  v.price = Number(v.price);
  v.ratingAvg = Number(v.ratingAvg);
  if (v.flashSalePercent != null) v.flashSalePercent = Number(v.flashSalePercent);

  // Active flash sale window
  const now = new Date();
  v.flashSaleActive =
    !!(v.flashSaleStart && v.flashSaleEnd && v.flashSalePercent &&
       new Date(v.flashSaleStart) <= now && now <= new Date(v.flashSaleEnd));
  v.flashSalePrice = v.flashSaleActive
    ? Math.round(v.price * (1 - v.flashSalePercent / 100) * 100) / 100
    : null;

  return v;
};
