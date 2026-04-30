import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Review = sequelize.define(
  'Review',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    text: { type: DataTypes.TEXT },
    photos: { type: DataTypes.JSON, defaultValue: [] },
    helpfulCount: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    notHelpfulCount: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  },
  {
    tableName: 'reviews',
    indexes: [{ fields: ['productId'] }, { fields: ['userId'] }],
  }
);

Review.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  v.photos = Array.isArray(v.photos) ? v.photos : [];
  return v;
};
