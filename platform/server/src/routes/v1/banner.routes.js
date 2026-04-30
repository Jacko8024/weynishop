import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Banner } from '../../models/Banner.js';
import { protect, requireRole } from '../../middleware/auth.js';

const router = Router();

// Public — active banners ordered for storefront carousel
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Banner.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json({ items });
  })
);

// Admin — list ALL banners (active + inactive)
router.get(
  '/admin',
  protect,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const items = await Banner.findAll({
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json({ items });
  })
);

router.post(
  '/admin',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { title = '', subtitle = '', imageUrl, linkUrl = '', displayOrder = 0, isActive = true } = req.body;
    if (!imageUrl) return res.status(400).json({ message: 'imageUrl required' });
    const b = await Banner.create({ title, subtitle, imageUrl, linkUrl, displayOrder, isActive });
    res.status(201).json({ banner: b });
  })
);

router.put(
  '/admin/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const b = await Banner.findByPk(req.params.id);
    if (!b) return res.status(404).json({ message: 'Banner not found' });
    ['title', 'subtitle', 'imageUrl', 'linkUrl', 'displayOrder', 'isActive'].forEach((f) => {
      if (req.body[f] !== undefined) b[f] = req.body[f];
    });
    await b.save();
    res.json({ banner: b });
  })
);

router.delete(
  '/admin/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const n = await Banner.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ message: 'Banner not found' });
    res.json({ ok: true });
  })
);

export default router;
