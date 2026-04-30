import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Op, fn, col } from 'sequelize';
import { User, Order, Product, Dispute, Settings } from '../../models/index.js';
import { protect, requireRole } from '../../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('admin'));

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { role, status, q } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (q) where[Op.or] = [{ name: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } }];
    const users = await User.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json({ users });
  })
);

router.put(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const u = await User.findByPk(req.params.id);
    if (!u) return res.status(404).json({ message: 'User not found' });
    const { status, flagged } = req.body;
    if (status) u.status = status;
    if (flagged !== undefined) u.flagged = !!flagged;
    await u.save();
    res.json({ user: u });
  })
);

router.get(
  '/live-deliveries',
  asyncHandler(async (_req, res) => {
    const orders = await Order.findAll({
      where: { currentStage: { [Op.in]: ['picked_up', 'out_for_delivery'] }, cancelledAt: null },
      include: [
        { model: User, as: 'deliveryPerson', attributes: ['id', 'name', 'currentLat', 'currentLng'] },
        { model: User, as: 'buyer', attributes: ['id', 'name'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'shopName'] },
      ],
    });
    res.json({ orders });
  })
);

router.get(
  '/delivery-persons',
  asyncHandler(async (_req, res) => {
    const users = await User.findAll({ where: { role: 'delivery' } });
    res.json({ users });
  })
);

router.get(
  '/analytics',
  asyncHandler(async (_req, res) => {
    const [totalOrders, completedRows, activeOrders, totalProducts, byRole] = await Promise.all([
      Order.count(),
      Order.findAll({ where: { currentStage: 'delivered_paid' } }),
      Order.count({ where: { currentStage: { [Op.ne]: 'delivered_paid' }, cancelledAt: null } }),
      Product.count(),
      User.findAll({ attributes: ['role', [fn('COUNT', col('id')), 'n']], group: ['role'], raw: true }),
    ]);
    const revenue = completedRows.reduce((s, o) => s + Number(o.total), 0);
    const usersByRole = Object.fromEntries(byRole.map((r) => [r.role, Number(r.n)]));
    res.json({
      totalOrders,
      completed: completedRows.length,
      activeOrders,
      revenue,
      totalProducts,
      usersByRole,
    });
  })
);

router.get(
  '/disputes',
  asyncHandler(async (_req, res) => {
    const items = await Dispute.findAll({
      include: [
        { model: Order },
        { model: User, as: 'raisedBy', attributes: ['id', 'name', 'role'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ items });
  })
);

router.put(
  '/disputes/:id',
  asyncHandler(async (req, res) => {
    const d = await Dispute.findByPk(req.params.id);
    if (!d) return res.status(404).json({ message: 'Not found' });
    const { status, resolution } = req.body;
    if (status) d.status = status;
    if (resolution !== undefined) d.resolution = resolution;
    await d.save();
    res.json({ dispute: d });
  })
);

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const s = await Settings.getSingleton();
    res.json({ settings: s });
  })
);

router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const s = await Settings.getSingleton();
    ['deliveryRadiusKm', 'commissionPercent', 'flatDeliveryFee', 'notificationTemplates'].forEach((f) => {
      if (req.body[f] !== undefined) s[f] = req.body[f];
    });
    await s.save();
    res.json({ settings: s });
  })
);

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.stage) where.currentStage = req.query.stage;
    const orders = await Order.findAll({
      where,
      include: [
        { model: User, as: 'buyer', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'seller', attributes: ['id', 'name', 'shopName'] },
        { model: User, as: 'deliveryPerson', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 200,
    });
    res.json({ orders });
  })
);

export default router;
