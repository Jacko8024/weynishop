import { sequelize } from '../config/db.js';
import { User } from './User.js';
import { Product } from './Product.js';
import { Order, STAGES, STAGE_LABELS } from './Order.js';
import { OrderItem } from './OrderItem.js';
import { OrderStage } from './OrderStage.js';
import { DeliveryAssignment } from './DeliveryAssignment.js';
import { Dispute } from './Dispute.js';
import { Settings } from './Settings.js';
import { Wishlist } from './Wishlist.js';
import { Review } from './Review.js';
import { ProductQuestion } from './ProductQuestion.js';
import { SellerFollow } from './SellerFollow.js';
import { CommissionLedger } from './CommissionLedger.js';

// Core associations
Product.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });
User.hasMany(Product, { foreignKey: 'sellerId' });

Order.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });
Order.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });
Order.belongsTo(User, { as: 'deliveryPerson', foreignKey: 'deliveryPersonId' });

Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

Order.hasMany(OrderStage, { as: 'stages', foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderStage.belongsTo(Order, { foreignKey: 'orderId' });

DeliveryAssignment.belongsTo(Order, { foreignKey: 'orderId' });
DeliveryAssignment.belongsTo(User, { as: 'deliveryPerson', foreignKey: 'deliveryPersonId' });

Dispute.belongsTo(Order, { foreignKey: 'orderId' });
Dispute.belongsTo(User, { as: 'raisedBy', foreignKey: 'raisedById' });

// Marketplace associations
Wishlist.belongsTo(User, { foreignKey: 'userId' });
Wishlist.belongsTo(Product, { foreignKey: 'productId' });
User.hasMany(Wishlist, { foreignKey: 'userId' });

Review.belongsTo(Product, { foreignKey: 'productId' });
Review.belongsTo(User, { as: 'author', foreignKey: 'userId' });
Product.hasMany(Review, { as: 'reviews', foreignKey: 'productId' });

ProductQuestion.belongsTo(Product, { foreignKey: 'productId' });
ProductQuestion.belongsTo(User, { as: 'asker', foreignKey: 'userId' });
ProductQuestion.belongsTo(User, { as: 'answeredBy', foreignKey: 'answeredById' });
Product.hasMany(ProductQuestion, { as: 'questions', foreignKey: 'productId' });

SellerFollow.belongsTo(User, { as: 'follower', foreignKey: 'userId' });
SellerFollow.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });

// Commission ledger associations
CommissionLedger.belongsTo(User, { as: 'seller', foreignKey: 'sellerId' });
CommissionLedger.belongsTo(Product, { as: 'product', foreignKey: 'productId' });
User.hasMany(CommissionLedger, { foreignKey: 'sellerId' });

export {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
  OrderStage,
  DeliveryAssignment,
  Dispute,
  Settings,
  Wishlist,
  Review,
  ProductQuestion,
  SellerFollow,
  CommissionLedger,
  STAGES,
  STAGE_LABELS,
};
