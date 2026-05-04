import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Banner = sequelize.define(
  'Banner',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(200), defaultValue: '' },
    subtitle: { type: DataTypes.STRING(300), defaultValue: '' },
    imageUrl: { type: DataTypes.STRING(1000), allowNull: false },
    linkUrl: { type: DataTypes.STRING(1000), defaultValue: '' },
    ctaLabel: { type: DataTypes.STRING(60), defaultValue: '' },
    displayOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: 'banners',
    indexes: [{ fields: ['isActive'] }, { fields: ['displayOrder'] }],
  }
);

Banner.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  return v;
};

