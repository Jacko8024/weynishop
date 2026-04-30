import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Wishlist = sequelize.define(
  'Wishlist',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    tableName: 'wishlists',
    indexes: [{ unique: true, fields: ['userId', 'productId'] }],
  }
);
