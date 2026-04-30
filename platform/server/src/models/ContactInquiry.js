import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const ContactInquiry = sequelize.define(
  'ContactInquiry',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false },
    subject: { type: DataTypes.STRING(200), defaultValue: '' },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.ENUM('new', 'in_progress', 'resolved'),
      defaultValue: 'new',
    },
  },
  {
    tableName: 'contact_inquiries',
    indexes: [{ fields: ['status'] }, { fields: ['createdAt'] }],
  }
);

ContactInquiry.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  return v;
};
