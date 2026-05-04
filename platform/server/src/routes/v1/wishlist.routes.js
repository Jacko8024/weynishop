import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Wishlist, Product, User } from '../../models/index.js';
import { protect, requireRole } from '../../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('buyer'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          include: [{ model: User, as: 'seller', attributes: ['id', 'name', 'shopName', 'verified'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ items: items.map((w) => w.Product).filter(Boolean) });
  })
);

router.get(
  '/ids',
  asyncHandler(async (req, res) => {
    const items = await Wishlist.findAll({
      where: { userId: req.user.id },
      attributes: ['productId'],
    });
    res.json({ ids: items.map((w) => String(w.productId)) });
  })
);

router.post(
  '/:productId',
  asyncHandler(async (req, res) => {
    const productId = Number(req.params.productId);
    const exists = await Product.findByPk(productId);
    if (!exists) return res.status(404).json({ message: 'Product not found' });
    await Wishlist.findOrCreate({ where: { userId: req.user.id, productId } });
    res.status(201).json({ ok: true });
  })
);

router.delete(
  '/:productId',
  asyncHandler(async (req, res) => {
    await Wishlist.destroy({
      where: { userId: req.user.id, productId: Number(req.params.productId) },
    });
    res.json({ ok: true });
  })
);

export default router;
