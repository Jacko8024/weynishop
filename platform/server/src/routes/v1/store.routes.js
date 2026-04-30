import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { fn, col } from 'sequelize';
import { User, Product, SellerFollow, Order } from '../../models/index.js';
import { protect, requireRole } from '../../middleware/auth.js';

const router = Router();

router.get(
  '/:sellerId',
  asyncHandler(async (req, res) => {
    const seller = await User.findOne({
      where: { id: req.params.sellerId, role: 'seller' },
    });
    if (!seller) return res.status(404).json({ message: 'Store not found' });

    const [products, completedSales, [ratingAgg]] = await Promise.all([
      Product.findAll({ where: { sellerId: seller.id, isActive: true }, order: [['soldCount', 'DESC']], limit: 60 }),
      Order.count({ where: { sellerId: seller.id, currentStage: 'delivered_paid' } }),
      Product.findAll({
        where: { sellerId: seller.id },
        attributes: [
          [fn('AVG', col('ratingAvg')), 'avg'],
          [fn('SUM', col('ratingCount')), 'count'],
        ],
        raw: true,
      }),
    ]);

    res.json({
      seller: {
        id: seller.id,
        _id: String(seller.id),
        name: seller.name,
        shopName: seller.shopName || seller.name,
        verified: seller.verified,
        followerCount: seller.followerCount,
        storeBanner: seller.storeBanner,
        storeDescription: seller.storeDescription,
        memberSince: seller.createdAt,
      },
      stats: {
        products: products.length,
        sales: completedSales,
        ratingAvg: Number(ratingAgg?.avg) || 0,
        ratingCount: Number(ratingAgg?.count) || 0,
      },
      products,
    });
  })
);

router.post(
  '/:sellerId/follow',
  protect,
  requireRole('buyer'),
  asyncHandler(async (req, res) => {
    const sellerId = Number(req.params.sellerId);
    const [, created] = await SellerFollow.findOrCreate({
      where: { userId: req.user.id, sellerId },
    });
    if (created) await User.increment('followerCount', { by: 1, where: { id: sellerId } });
    res.json({ ok: true, following: true });
  })
);

router.delete(
  '/:sellerId/follow',
  protect,
  requireRole('buyer'),
  asyncHandler(async (req, res) => {
    const sellerId = Number(req.params.sellerId);
    const n = await SellerFollow.destroy({ where: { userId: req.user.id, sellerId } });
    if (n) await User.decrement('followerCount', { by: 1, where: { id: sellerId } });
    res.json({ ok: true, following: false });
  })
);

router.get(
  '/:sellerId/following',
  protect,
  requireRole('buyer'),
  asyncHandler(async (req, res) => {
    const f = await SellerFollow.findOne({
      where: { userId: req.user.id, sellerId: Number(req.params.sellerId) },
    });
    res.json({ following: !!f });
  })
);

export default router;
