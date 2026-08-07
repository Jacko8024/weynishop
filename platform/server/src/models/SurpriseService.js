import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const SurpriseService = sequelize.define(
  'SurpriseService',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    providerId: { type: DataTypes.INTEGER, allowNull: true },
    groupId: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'birthday' },
    groupTitle: { type: DataTypes.STRING(200), defaultValue: '' },
    groupSubtitle: { type: DataTypes.TEXT, defaultValue: '' },
    name: { type: DataTypes.STRING(160), allowNull: false },
    image: { type: DataTypes.STRING(1000), defaultValue: '' },
    rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 5.0 },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    features: { type: DataTypes.JSON, defaultValue: [] },
    displayOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'surprise_services',
    indexes: [{ fields: ['groupId'] }, { fields: ['providerId'] }],
  }
);

SurpriseService.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  v.rating = Number(v.rating);
  v.price = Number(v.price);
  if (!Array.isArray(v.features)) v.features = [];
  return v;
};

export default SurpriseService;