import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { fn, col, literal, Op } from 'sequelize';
import { CommissionLedger, SellerEarning, Order, Settings } from '../../models/index.js';
import { protect, requireRole } from '../../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('seller'));

// Outstanding balance + summary for the logged-in seller.
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const sellerId = req.user.id;
    const [pendingRow, paidRow, totalCount] = await Promise.all([
      CommissionLedger.findOne({
        where: { sellerId, status: 'pending' },
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'sum']],
        raw: true,
      }),
      CommissionLedger.findOne({
        where: { sellerId, status: 'paid' },
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'sum']],
        raw: true,
      }),
      CommissionLedger.count({ where: { sellerId } }),
    ]);
    const settings = await Settings.getSingleton();
    res.json({
      pendingBalance: Number(pendingRow?.sum || 0),
      paidTotal: Number(paidRow?.sum || 0),
      entries: totalCount,
      currency: settings.commissionCurrency || 'ETB',
    });
  })
);

// Paginated commission history for the logged-in seller.
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const sellerId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const { rows, count } = await CommissionLedger.findAndCountAll({
      where: { sellerId },
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    });
    res.json({ items: rows, total: count, page, limit });
  })
);

// ---------------- Seller earnings wallet ----------------
// Net earnings (after platform commission) credited automatically when the
// order is delivered_paid. See SellerEarning ledger.
router.get(
  '/earnings/summary',
  asyncHandler(async (req, res) => {
    const sellerId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const sumAttr = (k) => [fn('COALESCE', fn('SUM', col(k)), 0), `sum_${k}`];
    const aggregate = (where) =>
      SellerEarning.findOne({
        where: { sellerId, ...where },
        attributes: [sumAttr('gross'), sumAttr('commission'), sumAttr('net')],
        raw: true,
      });

    const [allRow, monthRow, todayRow] = await Promise.all([
      aggregate({}),
      aggregate({ createdAt: { [Op.gte]: startOfMonth } }),
      aggregate({ createdAt: { [Op.gte]: startOfDay } }),
    ]);

    const settings = await Settings.getSingleton();
    res.json({
      currency: settings.commissionCurrency || 'ETB',
      total: {
        gross: Number(allRow?.sum_gross || 0),
        commission: Number(allRow?.sum_commission || 0),
        net: Number(allRow?.sum_net || 0),
      },
      thisMonth: {
        gross: Number(monthRow?.sum_gross || 0),
        commission: Number(monthRow?.sum_commission || 0),
        net: Number(monthRow?.sum_net || 0),
      },
      today: {
        gross: Number(todayRow?.sum_gross || 0),
        commission: Number(todayRow?.sum_commission || 0),
        net: Number(todayRow?.sum_net || 0),
      },
    });
  })
);

router.get(
  '/earnings/transactions',
  asyncHandler(async (req, res) => {
    const sellerId = req.user.id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const { rows, count } = await SellerEarning.findAndCountAll({
      where: { sellerId },
      include: [{ model: Order, as: 'order', attributes: ['id', 'currentStage', 'total', 'updatedAt'] }],
      order: [['createdAt', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    });
    res.json({ items: rows, total: count, page, limit });
  })
);

export default router;
