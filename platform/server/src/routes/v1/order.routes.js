import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Op, literal } from 'sequelize';
import { sequelize, Order, OrderItem, OrderStage, Product, User, Settings, STAGES } from '../../models/index.js';
import { protect, requireRole } from '../../middleware/auth.js';
import { broadcastStage } from '../../sockets/index.js';
import { chargeSaleCommission } from '../../services/commission.service.js';

const router = Router();

const orderIncludes = [
  { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'phone'] },
  {
    model: User,
    as: 'seller',
    attributes: ['id', 'name', 'email', 'shopName', 'pickupLat', 'pickupLng', 'pickupAddress'],
  },
  {
    model: User,
    as: 'deliveryPerson',
    attributes: ['id', 'name', 'email', 'phone', 'currentLat', 'currentLng'],
  },
  { model: OrderItem, as: 'items' },
  { model: OrderStage, as: 'stages', separate: true, order: [['at', 'ASC']] },
];

const fetchOrder = (id) => Order.findByPk(id, { include: orderIncludes });

const advanceStage = async (order, target, io) => {
  const idx = STAGES.indexOf(order.currentStage);
  const targetIdx = STAGES.indexOf(target);
  if (targetIdx === -1) throw Object.assign(new Error('Unknown stage'), { status: 400 });
  if (targetIdx !== idx + 1)
    throw Object.assign(new Error(`Cannot advance from ${order.currentStage} to ${target}`), { status: 400 });
  order.currentStage = target;
  if (target === 'delivered_paid') order.paymentStatus = 'paid';
  await order.save();
  await OrderStage.create({ orderId: order.id, stage: target });
  const stages = await OrderStage.findAll({ where: { orderId: order.id }, order: [['at', 'ASC']] });
  broadcastStage(io, order, stages);

  // When the order is paid (cash collected on delivery), record the
  // platform's sale commission. Idempotent — safe even if this runs twice.
  // Fire-and-forget: a commission failure must not break the stage transition.
  if (target === 'delivered_paid') {
    chargeSaleCommission(order).catch((err) =>
      console.error('[commission] failed to record sale commission for order', order.id, err)
    );
  }
  return order;
};

// ---------------- BUYER: create ----------------
router.post(
  '/',
  protect,
  requireRole('buyer'),
  asyncHandler(async (req, res) => {
    const { items, deliveryLocation } = req.body;
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ message: 'items required' });
    if (!deliveryLocation || !Array.isArray(deliveryLocation.coordinates))
      return res.status(400).json({ message: 'deliveryLocation required' });

    const ids = items.map((i) => i.product);
    const products = await Product.findAll({ where: { id: { [Op.in]: ids }, isActive: true } });
    if (products.length !== ids.length)
      return res.status(400).json({ message: 'Some products are unavailable' });

    const bySeller = new Map();
    for (const it of items) {
      const p = products.find((x) => String(x.id) === String(it.product));
      if (!p) return res.status(400).json({ message: 'Product missing' });
      if (p.stock < it.qty) return res.status(409).json({ message: `Out of stock: ${p.name}` });
      const sid = String(p.sellerId);
      if (!bySeller.has(sid)) bySeller.set(sid, []);
      bySeller.get(sid).push({ p, qty: it.qty });
    }

    const settings = await Settings.getSingleton();
    const created = [];

    await sequelize.transaction(async (t) => {
      for (const [sid, group] of bySeller) {
        const seller = await User.findByPk(sid, { transaction: t });
        if (!seller || seller.pickupLat == null || seller.pickupLng == null) {
          throw Object.assign(new Error('Seller has no pickup location set'), { status: 400 });
        }

        // decrement stock atomically using conditional UPDATE
        for (const { p, qty } of group) {
          const [n] = await Product.update(
            { stock: literal(`stock - ${Number(qty)}`) },
            { where: { id: p.id, stock: { [Op.gte]: qty } }, transaction: t }
          );
          if (!n) throw Object.assign(new Error(`Out of stock: ${p.name}`), { status: 409 });
        }

        const subtotal = group.reduce((s, { p, qty }) => s + Number(p.price) * qty, 0);
        const deliveryFee = Number(settings.flatDeliveryFee || 0);

        const order = await Order.create(
          {
            buyerId: req.user.id,
            sellerId: seller.id,
            subtotal,
            deliveryFee,
            total: subtotal + deliveryFee,
            pickupLat: seller.pickupLat,
            pickupLng: seller.pickupLng,
            pickupAddress: seller.pickupAddress || '',
            deliveryLat: deliveryLocation.coordinates[1],
            deliveryLng: deliveryLocation.coordinates[0],
            deliveryAddress: deliveryLocation.address || '',
            currentStage: 'placed',
          },
          { transaction: t }
        );

        await OrderItem.bulkCreate(
          group.map(({ p, qty }) => ({
            orderId: order.id,
            productId: p.id,
            name: p.name,
            price: p.price,
            qty,
            image: p.image || '',
          })),
          { transaction: t }
        );
        await OrderStage.create({ orderId: order.id, stage: 'placed' }, { transaction: t });

        created.push(order);
      }
    });

    const io = req.app.locals.io;
    const fullOrders = [];
    for (const o of created) {
      const full = await fetchOrder(o.id);
      fullOrders.push(full);
      io.to(`user:${o.sellerId}`).emit('notify', { type: 'order:new', orderId: String(o.id) });
      broadcastStage(io, full, full.stages);
    }
    res.status(201).json({ orders: fullOrders });
  })
);

// ---------------- LIST ----------------
router.get(
  '/mine',
  protect,
  requireRole('buyer'),
  asyncHandler(async (req, res) => {
    const orders = await Order.findAll({
      where: { buyerId: req.user.id },
      include: orderIncludes,
      order: [['createdAt', 'DESC']],
    });
    res.json({ orders });
  })
);

router.get(
  '/seller',
  protect,
  requireRole('seller'),
  asyncHandler(async (req, res) => {
    const { status, from, to } = req.query;
    const where = { sellerId: req.user.id };
    if (status) where.currentStage = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }
    const orders = await Order.findAll({ where, include: orderIncludes, order: [['createdAt', 'DESC']] });
    res.json({ orders });
  })
);

router.get(
  '/delivery',
  protect,
  requireRole('delivery'),
  asyncHandler(async (req, res) => {
    const orders = await Order.findAll({
      where: { deliveryPersonId: req.user.id },
      include: orderIncludes,
      order: [['createdAt', 'DESC']],
    });
    res.json({ orders });
  })
);

router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await fetchOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const uid = req.user.id;
    const allowed =
      req.user.role === 'admin' ||
      order.buyerId === uid ||
      order.sellerId === uid ||
      order.deliveryPersonId === uid;
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });
    res.json({ order });
  })
);

// ---------------- STAGE TRANSITIONS ----------------
router.post(
  '/:id/accept',
  protect,
  requireRole('seller'),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ where: { id: req.params.id, sellerId: req.user.id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await advanceStage(order, 'preparing', req.app.locals.io);
    res.json({ order: await fetchOrder(order.id) });
  })
);

router.post(
  '/:id/ready',
  protect,
  requireRole('seller'),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ where: { id: req.params.id, sellerId: req.user.id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await advanceStage(order, 'ready_for_pickup', req.app.locals.io);
    res.json({ order: await fetchOrder(order.id) });
  })
);

router.post(
  '/:id/pickup',
  protect,
  requireRole('delivery'),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ where: { id: req.params.id, deliveryPersonId: req.user.id } });
    if (!order) return res.status(404).json({ message: 'Order not found / not assigned to you' });
    await advanceStage(order, 'picked_up', req.app.locals.io);
    await User.update({ activeOrderId: order.id }, { where: { id: req.user.id } });
    res.json({ order: await fetchOrder(order.id) });
  })
);

router.post(
  '/:id/out',
  protect,
  requireRole('delivery'),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ where: { id: req.params.id, deliveryPersonId: req.user.id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await advanceStage(order, 'out_for_delivery', req.app.locals.io);
    res.json({ order: await fetchOrder(order.id) });
  })
);

router.post(
  '/:id/delivered',
  protect,
  requireRole('delivery'),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ where: { id: req.params.id, deliveryPersonId: req.user.id } });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await advanceStage(order, 'delivered_paid', req.app.locals.io);
    await User.update({ activeOrderId: null }, { where: { id: req.user.id } });
    res.json({ order: await fetchOrder(order.id) });
  })
);

// Buyer cancel (stages 1 or 2 only)
router.post(
  '/:id/cancel',
  protect,
  requireRole('buyer'),
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({
      where: { id: req.params.id, buyerId: req.user.id },
      include: [{ model: OrderItem, as: 'items' }],
    });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['placed', 'preparing'].includes(order.currentStage))
      return res.status(400).json({ message: 'Order can no longer be cancelled' });

    await sequelize.transaction(async (t) => {
      order.cancelledAt = new Date();
      order.cancelReason = req.body?.reason || 'Cancelled by buyer';
      await order.save({ transaction: t });
      // restock
      for (const it of order.items) {
        await Product.update(
          { stock: literal(`stock + ${Number(it.qty)}`) },
          { where: { id: it.productId }, transaction: t }
        );
      }
    });

    const io = req.app.locals.io;
    io.to(`order:${order.id}`).emit('order:cancelled', { orderId: String(order.id) });
    io.to(`user:${order.sellerId}`).emit('notify', { type: 'order:cancelled', orderId: String(order.id) });
    res.json({ order: await fetchOrder(order.id) });
  })
);

export default router;
