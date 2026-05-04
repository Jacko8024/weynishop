import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Category = sequelize.define(
  'Category',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    label: { type: DataTypes.STRING(120), allowNull: false },
    emoji: { type: DataTypes.STRING(16), defaultValue: 'ðŸŽ' },
    displayOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'categories',
    indexes: [{ fields: ['isActive'] }, { fields: ['displayOrder'] }],
  }
);

Category.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  return v;
};

