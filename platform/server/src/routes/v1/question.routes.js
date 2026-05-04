import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { ProductQuestion, Product, User } from '../../models/index.js';
import { protect } from '../../middleware/auth.js';

const router = Router();

router.get(
  '/product/:productId',
  asyncHandler(async (req, res) => {
    const items = await ProductQuestion.findAll({
      where: { productId: req.params.productId },
      include: [
        { model: User, as: 'asker', attributes: ['id', 'name'] },
        { model: User, as: 'answeredBy', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json({ items });
  })
);

router.post(
  '/product/:productId',
  protect,
  asyncHandler(async (req, res) => {
    const product = await Product.findByPk(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'text required' });
    const q = await ProductQuestion.create({
      productId: product.id,
      userId: req.user.id,
      text: text.trim(),
    });
    res.status(201).json({ question: q });
  })
);

router.post(
  '/:id/answer',
  protect,
  asyncHandler(async (req, res) => {
    const q = await ProductQuestion.findByPk(req.params.id);
    if (!q) return res.status(404).json({ message: 'Not found' });
    const product = await Product.findByPk(q.productId);
    if (!product || (product.sellerId !== req.user.id && req.user.role !== 'admin'))
      return res.status(403).json({ message: 'Only the seller can answer' });
    q.answer = (req.body.answer || '').trim();
    q.answeredAt = new Date();
    q.answeredById = req.user.id;
    await q.save();
    res.json({ question: q });
  })
);

export default router;
