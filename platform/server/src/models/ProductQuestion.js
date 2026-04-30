import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const ProductQuestion = sequelize.define(
  'ProductQuestion',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    answer: { type: DataTypes.TEXT },
    answeredAt: { type: DataTypes.DATE, allowNull: true },
    answeredById: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    tableName: 'product_questions',
    indexes: [{ fields: ['productId'] }],
  }
);

ProductQuestion.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  return v;
};
