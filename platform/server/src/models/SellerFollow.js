import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const SellerFollow = sequelize.define(
  'SellerFollow',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    sellerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    tableName: 'seller_follows',
    indexes: [{ unique: true, fields: ['userId', 'sellerId'] }],
  }
);
