import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { fn, col, literal } from 'sequelize';
import { CommissionLedger, Settings } from '../../models/index.js';
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

export default router;
