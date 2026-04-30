import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { Order, User, OrderItem, OrderStage, DeliveryAssignment } from '../../models/index.js';
import { protect, requireRole } from '../../middleware/auth.js';
import { broadcastStage } from '../../sockets/index.js';

const router = Router();

router.get(
  '/available',
  protect,
  requireRole('delivery'),
  asyncHandler(async (_req, res) => {
    const orders = await Order.findAll({
      where: { currentStage: 'ready_for_pickup', deliveryPersonId: null, cancelledAt: null },
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'name', 'shopName', 'pickupLat', 'pickupLng', 'pickupAddress'],
        },
        { model: User, as: 'buyer', attributes: ['id', 'name'] },
        { model: OrderItem, as: 'items' },
      ],
      order: [['createdAt', 'ASC']],
    });
    res.json({ orders });
  })
);

router.post(
  '/:orderId/accept',
  protect,
  requireRole('delivery'),
  asyncHandler(async (req, res) => {
    const order = await Order.findByPk(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.deliveryPersonId) return res.status(409).json({ message: 'Already assigned' });
    if (order.currentStage !== 'ready_for_pickup')
      return res.status(400).json({ message: 'Order not ready for pickup' });

    order.deliveryPersonId = req.user.id;
    await order.save();
    await DeliveryAssignment.create({ orderId: order.id, deliveryPersonId: req.user.id });

    const io = req.app.locals.io;
    io.to(`user:${order.sellerId}`).emit('notify', { type: 'delivery:assigned', orderId: String(order.id) });
    io.to(`user:${order.buyerId}`).emit('notify', { type: 'delivery:assigned', orderId: String(order.id) });
    const stages = await OrderStage.findAll({ where: { orderId: order.id }, order: [['at', 'ASC']] });
    broadcastStage(io, order, stages);
    res.json({ order });
  })
);

router.get(
  '/earnings',
  protect,
  requireRole('delivery'),
  asyncHandler(async (req, res) => {
    const completed = await Order.findAll({
      where: { deliveryPersonId: req.user.id, currentStage: 'delivered_paid' },
    });
    const totalCash = completed.reduce((s, o) => s + Number(o.total), 0);
    res.json({ deliveriesCompleted: completed.length, totalCashHandled: totalCash });
  })
);

router.post(
  '/online',
  protect,
  requireRole('delivery'),
  asyncHandler(async (req, res) => {
    await User.update({ isOnline: !!req.body.online }, { where: { id: req.user.id } });
    res.json({ ok: true });
  })
);

export default router;
