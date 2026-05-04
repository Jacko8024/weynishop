import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Category } from '../../models/Category.js';
import { protect, requireRole } from '../../middleware/auth.js';

const router = Router();

// Public — list all active categories with emojis (used by nav, listings, search)
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Category.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['label', 'ASC']],
    });
    res.json({ items });
  })
);

// Admin — list everything
router.get(
  '/admin',
  protect,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    const items = await Category.findAll({ order: [['displayOrder', 'ASC'], ['label', 'ASC']] });
    res.json({ items });
  })
);

const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'general';

router.post(
  '/admin',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const { label, emoji = '🎁', key, displayOrder = 0, isActive = true } = req.body;
    if (!label) return res.status(400).json({ message: 'label required' });
    const finalKey = slugify(key || label);
    try {
      const c = await Category.create({ key: finalKey, label, emoji, displayOrder, isActive });
      res.status(201).json({ category: c });
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Category key already exists' });
      }
      throw e;
    }
  })
);

router.put(
  '/admin/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const c = await Category.findByPk(req.params.id);
    if (!c) return res.status(404).json({ message: 'Category not found' });
    ['label', 'emoji', 'displayOrder', 'isActive'].forEach((f) => {
      if (req.body[f] !== undefined) c[f] = req.body[f];
    });
    if (req.body.key) c.key = slugify(req.body.key);
    await c.save();
    res.json({ category: c });
  })
);

router.delete(
  '/admin/:id',
  protect,
  requireRole('admin'),
  asyncHandler(async (req, res) => {
    const n = await Category.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ message: 'Category not found' });
    res.json({ ok: true });
  })
);

export default router;
