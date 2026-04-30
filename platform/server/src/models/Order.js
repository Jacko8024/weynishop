import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const STAGES = [
  'placed',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered_paid',
];

export const STAGE_LABELS = {
  placed: 'Order Placed',
  preparing: 'Seller Preparing',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered_paid: 'Delivered & Paid',
};

export const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    buyerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    sellerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    deliveryPersonId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },

    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    deliveryFee: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },

    paymentMethod: { type: DataTypes.ENUM('cash'), defaultValue: 'cash' },
    paymentStatus: { type: DataTypes.ENUM('pending', 'paid'), defaultValue: 'pending' },

    pickupLat: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    pickupLng: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    pickupAddress: { type: DataTypes.STRING(255), defaultValue: '' },

    deliveryLat: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    deliveryLng: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
    deliveryAddress: { type: DataTypes.STRING(255), defaultValue: '' },

    currentStage: { type: DataTypes.ENUM(...STAGES), defaultValue: 'placed' },

    cancelledAt: { type: DataTypes.DATE, allowNull: true },
    cancelReason: { type: DataTypes.STRING(255), defaultValue: '' },
  },
  {
    tableName: 'orders',
    indexes: [
      { fields: ['buyerId'] },
      { fields: ['sellerId'] },
      { fields: ['deliveryPersonId'] },
      { fields: ['currentStage'] },
    ],
  }
);

Order.prototype.toJSON = function () {
  const v = { ...this.get() };
  v._id = String(v.id);
  v.pickupLocation = {
    type: 'Point',
    coordinates: [Number(v.pickupLng), Number(v.pickupLat)],
    address: v.pickupAddress || '',
  };
  v.deliveryLocation = {
    type: 'Point',
    coordinates: [Number(v.deliveryLng), Number(v.deliveryLat)],
    address: v.deliveryAddress || '',
  };
  // numeric coercion for decimals (Sequelize returns strings for DECIMAL)
  v.subtotal = Number(v.subtotal);
  v.deliveryFee = Number(v.deliveryFee);
  v.total = Number(v.total);
  // Map associations to expected keys
  if (v.buyer) v.buyer = v.buyer;
  if (v.seller) v.seller = v.seller;
  if (v.deliveryPerson) v.deliveryPerson = v.deliveryPerson;
  if (v.items) v.items = v.items;
  if (v.stages) v.stages = v.stages;
  return v;
};
