import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Dispute = sequelize.define(
  'Dispute',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    raisedById: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    against: { type: DataTypes.ENUM('buyer', 'seller', 'delivery'), allowNull: false },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('open', 'resolved', 'rejected'), defaultValue: 'open' },
    resolution: { type: DataTypes.TEXT },
  },
  { tableName: 'disputes' }
);

Dispute.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  return v;
};
