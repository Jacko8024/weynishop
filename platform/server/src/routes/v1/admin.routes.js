import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Op, fn, col } from 'sequelize';
import { User, Order, Product, Dispute, Settings, VendorProfile, DeliveryProfile } from '../../models/index.js';
import { protect, requireRole, signToken } from '../../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('admin'));

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { role, status, q } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (q) where[Op.or] = [{ name: { [Op.iLike]: `%${q}%` } }, { email: { [Op.iLike]: `%${q}%` } }];
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

// ── Onboarding / Approval System ──────────────────────────────────────────

/** List pending vendors with their full profile */
router.get(
  '/pending/vendors',
  asyncHandler(async (_req, res) => {
    const users = await User.findAll({
      where: { role: 'seller', status: 'pending' },
      include: [{ model: VendorProfile, as: 'vendorProfile' }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ items: users });
  })
);

/** List pending delivery drivers with their full profile */
router.get(
  '/pending/delivery',
  asyncHandler(async (_req, res) => {
    const users = await User.findAll({
      where: { role: 'delivery', status: 'pending' },
      include: [{ model: DeliveryProfile, as: 'deliveryProfile' }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ items: users });
  })
);

/** Approve a pending user — sets status to 'active' */
router.put(
  '/users/:id/approve',
  asyncHandler(async (req, res) => {
    const u = await User.findByPk(req.params.id);
    if (!u) return res.status(404).json({ message: 'User not found' });
    if (u.status !== 'pending') return res.status(400).json({ message: 'User is not in pending status' });
    u.status = 'active';
    await u.save();
    res.json({ user: u });
  })
);

/** Reject a pending user — sets status to 'rejected' with an optional reason */
router.put(
  '/users/:id/reject',
  asyncHandler(async (req, res) => {
    const u = await User.findByPk(req.params.id);
    if (!u) return res.status(404).json({ message: 'User not found' });
    if (u.status !== 'pending') return res.status(400).json({ message: 'User is not in pending status' });
    u.status = 'rejected';
    u.rejectionReason = req.body.reason || '';
    await u.save();
    res.json({ user: u });
  })
);

// ── Impersonation — generate a JWT for any user ───────────────────────────

router.post(
  '/impersonate/:id',
  asyncHandler(async (req, res) => {
    const target = await User.findByPk(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    const token = signToken(target);
    res.json({
      token,
      user: { id: target.id, name: target.name, email: target.email, role: target.role, status: target.status },
    });
  })
);

// ── Product Management ─────────────────────────────────────────────────────

/** List all products (with filters, including inactive) */
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { q, category, seller, isActive, page = 1, limit = 50 } = req.query;
    const where = {};
    if (category) where.category = category;
    if (seller) where.sellerId = seller;
    if (isActive === 'true') where.isActive = true;
    else if (isActive === 'false') where.isActive = false;
    if (q) where[Op.or] = [{ name: { [Op.iLike]: `%${q}%` } }];

    const offset = (Number(page) - 1) * Number(limit);
    const { rows, count } = await Product.findAndCountAll({
      where,
      include: [{ model: User, as: 'seller', attributes: ['id', 'name', 'shopName'] }],
      offset,
      limit: Number(limit),
      order: [['createdAt', 'DESC']],
    });
    res.json({ items: rows, total: count, page: Number(page), limit: Number(limit) });
  })
);

/** Create a product on behalf of a seller */
router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const { sellerId } = req.body;
    if (!sellerId) return res.status(400).json({ message: 'sellerId is required' });
    const seller = await User.findByPk(sellerId);
    if (!seller || seller.role !== 'seller') return res.status(400).json({ message: 'Invalid seller' });

    const settings = await Settings.getSingleton();
    const pct = Number(settings.commissionPercent) || 0;
    const basePrice = Number(req.body.price) || 0;

    const product = await Product.create({
      sellerId: Number(sellerId),
      name: req.body.name,
      description: req.body.description || '',
      basePrice,
      price: Math.round(basePrice * (1 + pct / 100) * 100) / 100,
      commissionPercent: pct,
      stock: Number(req.body.stock) || 0,
      category: req.body.category || 'general',
      image: req.body.images?.[0] || '',
      images: req.body.images || [],
      isActive: req.body.isActive !== false,
      freeShipping: !!req.body.freeShipping,
      flashSaleStart: req.body.flashSaleStart || null,
      flashSaleEnd: req.body.flashSaleEnd || null,
      flashSalePercent: req.body.flashSalePercent || null,
      bulkPriceTiers: req.body.bulkPriceTiers || [],
    });
    res.status(201).json({ product });
  })
);

/** Update any product */
router.put(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const allowed = ['name', 'description', 'stock', 'category', 'images', 'isActive', 'freeShipping',
                     'flashSaleStart', 'flashSaleEnd', 'flashSalePercent', 'bulkPriceTiers'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    }

    if (req.body.price !== undefined) {
      const settings = await Settings.getSingleton();
      const pct = Number(settings.commissionPercent) || 0;
      const basePrice = Number(req.body.price) || 0;
      product.basePrice = basePrice;
      product.price = Math.round(basePrice * (1 + pct / 100) * 100) / 100;
      product.commissionPercent = pct;
    }

    await product.save();
    res.json({ product });
  })
);

/** Delete any product */
router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.destroy();
    res.json({ message: 'Deleted' });
  })
);

export default router;
