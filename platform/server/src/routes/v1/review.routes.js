import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { fn, col } from 'sequelize';
import { Review, Product, User, Order, OrderItem } from '../../models/index.js';
import { protect } from '../../middleware/auth.js';

const router = Router();

const recomputeRating = async (productId) => {
  const [r] = await Review.findAll({
    where: { productId },
    attributes: [
      [fn('AVG', col('rating')), 'avg'],
      [fn('COUNT', col('id')), 'count'],
    ],
    raw: true,
  });
  await Product.update(
    { ratingAvg: Number(r.avg) || 0, ratingCount: Number(r.count) || 0 },
    { where: { id: productId } }
  );
};

router.get(
  '/product/:productId',
  asyncHandler(async (req, res) => {
    const reviews = await Review.findAll({
      where: { productId: req.params.productId },
      include: [{ model: User, as: 'author', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    // breakdown 1..5
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });
    res.json({ reviews, breakdown });
  })
);

router.post(
  '/product/:productId',
  protect,
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    const { rating, text, photos } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: 'rating 1..5 required' });

    // Buyer must have actually purchased and received this product
    const purchased = await Order.findOne({
      where: { buyerId: req.user.id, currentStage: 'delivered_paid' },
      include: [{ model: OrderItem, as: 'items', where: { productId }, required: true }],
    });
    if (!purchased && req.user.role !== 'admin')
      return res.status(403).json({ message: 'You can only review products you have received' });

    const [review, created] = await Review.findOrCreate({
      where: { userId: req.user.id, productId },
      defaults: {
        rating,
        text: text || '',
        photos: Array.isArray(photos) ? photos : [],
        orderId: purchased?.id,
      },
    });
    if (!created) {
      review.rating = rating;
      review.text = text || '';
      review.photos = Array.isArray(photos) ? photos : [];
      await review.save();
    }
    await recomputeRating(productId);
    res.status(201).json({ review });
  })
);

router.post(
  '/:id/helpful',
  protect,
  asyncHandler(async (req, res) => {
    const r = await Review.findByPk(req.params.id);
    if (!r) return res.status(404).json({ message: 'Not found' });
    if (req.body.value === false) r.notHelpfulCount = (r.notHelpfulCount || 0) + 1;
    else r.helpfulCount = (r.helpfulCount || 0) + 1;
    await r.save();
    res.json({ review: r });
  })
);

export default router;
