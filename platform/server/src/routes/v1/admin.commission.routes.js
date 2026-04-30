import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Op, fn, col, literal } from 'sequelize';
import { CommissionLedger, Settings, User, Product } from '../../models/index.js';
import { protect, requireRole } from '../../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('admin'));

const sellerInclude = { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'shopName'] };

// Top stat-card data
router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [paidRow, monthRow, pendingRow, productCount] = await Promise.all([
      CommissionLedger.findOne({
        where: { status: 'paid' },
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'sum']],
        raw: true,
      }),
      CommissionLedger.findOne({
        where: { createdAt: { [Op.gte]: startOfMonth } },
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'sum']],
        raw: true,
      }),
      CommissionLedger.findOne({
        where: { status: 'pending' },
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'sum']],
        raw: true,
      }),
      Product.count(),
    ]);

    res.json({
      totalEarned: Number(paidRow?.sum || 0),
      thisMonth: Number(monthRow?.sum || 0),
      pending: Number(pendingRow?.sum || 0),
      productsListed: productCount,
    });
  })
);

// Last-12-month commission revenue grouped by month (sums BOTH paid + pending so
// the admin can see total volume; UI can split if desired).
router.get(
  '/monthly',
  asyncHandler(async (_req, res) => {
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const rows = await CommissionLedger.findAll({
      where: { createdAt: { [Op.gte]: since } },
      attributes: [
        [fn('DATE_FORMAT', col('createdAt'), '%Y-%m'), 'month'],
        [fn('COALESCE', fn('SUM', col('amount')), 0), 'totalAmount'],
      ],
      group: [literal('month')],
      order: [[literal('month'), 'ASC']],
      raw: true,
    });

    // Fill missing months with zero so the chart always has 12 buckets
    const buckets = [];
    for (let i = 0; i < 12; i += 1) {
      const d = new Date(since);
      d.setMonth(since.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = rows.find((r) => r.month === key);
      buckets.push({ month: key, totalAmount: Number(found?.totalAmount || 0) });
    }
    res.json({ months: buckets });
  })
);

// Paginated transactions table with filters.
router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const { status, sellerId, from, to, q } = req.query;
    const where = {};
    if (status && ['pending', 'paid'].includes(status)) where.status = status;
    if (sellerId) where.sellerId = sellerId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }
    if (q) where.productName = { [Op.iLike]: `%${q}%` };

    const { rows, count } = await CommissionLedger.findAndCountAll({
      where,
      include: [sellerInclude],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    });
    res.json({ items: rows, total: count, page, limit });
  })
);

// Per-seller breakdown
router.get(
  '/by-seller',
  asyncHandler(async (_req, res) => {
    const rows = await CommissionLedger.findAll({
      attributes: [
        'sellerId',
        [fn('SUM', literal("CASE WHEN `CommissionLedger`.`status`='pending' THEN `CommissionLedger`.`amount` ELSE 0 END")), 'pending'],
        [fn('SUM', literal("CASE WHEN `CommissionLedger`.`status`='paid' THEN `CommissionLedger`.`amount` ELSE 0 END")), 'paid'],
        [fn('COUNT', col('CommissionLedger.id')), 'entries'],
        [fn('MAX', col('CommissionLedger.paidAt')), 'lastPaidAt'],
      ],
      include: [sellerInclude],
      group: ['sellerId', 'seller.id'],
      raw: false,
    });
    res.json({
      sellers: rows.map((r) => ({
        sellerId: r.sellerId,
        seller: r.seller,
        pending: Number(r.get('pending') || 0),
        paid: Number(r.get('paid') || 0),
        entries: Number(r.get('entries') || 0),
        lastPaidAt: r.get('lastPaidAt'),
      })),
    });
  })
);

// Bulk mark transactions as paid.
router.patch(
  '/mark-paid',
  asyncHandler(async (req, res) => {
    const { ids = [], sellerId } = req.body;
    const where = { status: 'pending' };
    if (sellerId) where.sellerId = sellerId;
    if (Array.isArray(ids) && ids.length) where.id = { [Op.in]: ids };
    if (!sellerId && (!Array.isArray(ids) || !ids.length)) {
      return res.status(400).json({ message: 'Provide ids or sellerId' });
    }
    const [updated] = await CommissionLedger.update(
      { status: 'paid', paidAt: new Date() },
      { where }
    );
    res.json({ updated });
  })
);

// CSV export of all transactions matching given filters (no pagination)
router.get(
  '/export',
  asyncHandler(async (req, res) => {
    const { status, sellerId, from, to } = req.query;
    const where = {};
    if (status && ['pending', 'paid'].includes(status)) where.status = status;
    if (sellerId) where.sellerId = sellerId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) where.createdAt[Op.lte] = new Date(to);
    }
    const rows = await CommissionLedger.findAll({
      where, include: [sellerInclude], order: [['createdAt', 'DESC']], limit: 10000,
    });
    const escape = (v) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const header = ['id', 'date', 'seller', 'sellerEmail', 'product', 'amount', 'currency', 'type', 'status', 'paidAt'];
    const lines = [header.join(',')];
    rows.forEach((r) => {
      lines.push([
        r.id,
        new Date(r.createdAt).toISOString(),
        r.seller?.name || '',
        r.seller?.email || '',
        r.productName || '',
        Number(r.amount).toFixed(2),
        r.currency,
        r.type,
        r.status,
        r.paidAt ? new Date(r.paidAt).toISOString() : '',
      ].map(escape).join(','));
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="commission.csv"');
    res.send(lines.join('\n'));
  })
);

// Update commission settings (rate / type)
router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const s = await Settings.getSingleton();
    res.json({
      listingCommissionType: s.listingCommissionType,
      listingCommissionValue: Number(s.listingCommissionValue),
      commissionCurrency: s.commissionCurrency,
    });
  })
);

router.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    const s = await Settings.getSingleton();
    const { listingCommissionType, listingCommissionValue, commissionCurrency } = req.body;
    if (listingCommissionType && ['fixed', 'percentage'].includes(listingCommissionType)) {
      s.listingCommissionType = listingCommissionType;
    }
    if (listingCommissionValue !== undefined) {
      const v = Number(listingCommissionValue);
      if (!Number.isFinite(v) || v < 0) return res.status(400).json({ message: 'Invalid value' });
      s.listingCommissionValue = v;
    }
    if (commissionCurrency) s.commissionCurrency = String(commissionCurrency).slice(0, 8);
    await s.save();
    res.json({
      listingCommissionType: s.listingCommissionType,
      listingCommissionValue: Number(s.listingCommissionValue),
      commissionCurrency: s.commissionCurrency,
    });
  })
);

export default router;
