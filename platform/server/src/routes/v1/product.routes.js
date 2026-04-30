import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { Product } from '../../models/Product.js';
import { User } from '../../models/User.js';
import { Settings } from '../../models/Settings.js';
import { chargeListingFee } from '../../services/commission.service.js';
import { protect, requireRole } from '../../middleware/auth.js';

// Compute the buyer-facing final price from a seller-entered base price
// using the platform's current buyer-facing commission % (Settings.commissionPercent).
const computeFinalPrice = (basePrice, commissionPercent) => {
  const base = Number(basePrice) || 0;
  const pct = Number(commissionPercent) || 0;
  return Math.round(base * (1 + pct / 100) * 100) / 100;
};

const router = Router();

const sellerInclude = { model: User, as: 'seller', attributes: ['id', 'name', 'shopName', 'verified'] };

const SORT_MAP = {
  best: [['soldCount', 'DESC'], ['ratingAvg', 'DESC']],
  priceLow: [['price', 'ASC']],
  priceHigh: [['price', 'DESC']],
  mostSold: [['soldCount', 'DESC']],
  newest: [['createdAt', 'DESC']],
  topRated: [['ratingAvg', 'DESC'], ['ratingCount', 'DESC']],
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const {
      q, category, minPrice, maxPrice, seller,
      minRating, freeShipping, verifiedSeller,
      flashSale, sort = 'best', page = 1, limit = 24,
    } = req.query;

    const where = { isActive: true };
    if (category) where.category = Array.isArray(category) ? { [Op.in]: category } : category;
    if (seller) where.sellerId = seller;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }
    if (minRating) where.ratingAvg = { [Op.gte]: Number(minRating) };
    if (freeShipping === 'true' || freeShipping === '1') where.freeShipping = true;
    if (flashSale === 'true' || flashSale === '1') {
      const now = new Date();
      where.flashSaleStart = { [Op.lte]: now };
      where.flashSaleEnd = { [Op.gte]: now };
    }
    // Postgres: iLike for case-insensitive matching (LIKE is case-sensitive on PG).
    if (q) where[Op.or] = [{ name: { [Op.iLike]: `%${q}%` } }, { description: { [Op.iLike]: `%${q}%` } }];

    const sellerWhere = verifiedSeller === 'true' || verifiedSeller === '1' ? { verified: true } : undefined;

    const offset = (Number(page) - 1) * Number(limit);
    const order = SORT_MAP[sort] || SORT_MAP.best;

    const { rows, count } = await Product.findAndCountAll({
      where,
      include: [{ ...sellerInclude, where: sellerWhere, required: !!sellerWhere }],
      offset,
      limit: Number(limit),
      order,
    });
    res.json({ items: rows, total: count, page: Number(page), limit: Number(limit) });
  })
);

router.get(
  '/flash-deals',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const items = await Product.findAll({
      where: {
        isActive: true,
        flashSaleStart: { [Op.lte]: now },
        flashSaleEnd: { [Op.gte]: now },
      },
      include: [sellerInclude],
      order: [['flashSalePercent', 'DESC']],
      limit: 24,
    });
    res.json({ items });
  })
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const rows = await Product.findAll({
      attributes: ['category'],
      where: { isActive: true },
      group: ['category'],
    });
    res.json({ categories: rows.map((r) => r.category) });
  })
);

router.get(
  '/mine',
  protect,
  requireRole('seller'),
  asyncHandler(async (req, res) => {
    const items = await Product.findAll({ where: { sellerId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json({ items });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const p = await Product.findByPk(req.params.id, { include: [sellerInclude] });
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json({ product: p });
  })
);

// People also bought — top-selling products in same category, excluding this product.
router.get(
  '/:id/related',
  asyncHandler(async (req, res) => {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.json({ items: [] });
    const items = await Product.findAll({
      where: { id: { [Op.ne]: p.id }, isActive: true, category: p.category },
      include: [sellerInclude],
      order: [['soldCount', 'DESC']],
      limit: 10,
    });
    res.json({ items });
  })
);

router.post(
  '/',
  protect,
  requireRole('seller'),
  asyncHandler(async (req, res) => {
    const { name, description, price, stock, category, images,
            flashSaleStart, flashSaleEnd, flashSalePercent,
            bulkPriceTiers, freeShipping } = req.body;
    if (!name || price == null) return res.status(400).json({ message: 'name and price required' });
    const imgArr = Array.isArray(images) ? images.filter(Boolean) : [];

    // Snapshot the current platform commission % and store both the seller's base
    // price and the buyer-facing final price so the storefront never shows the
    // breakdown and the seller's reports remain accurate even if the % changes later.
    const settings = await Settings.getSingleton();
    const commissionPercent = Number(settings.commissionPercent) || 0;
    const basePrice = Number(price) || 0;
    const finalPrice = computeFinalPrice(basePrice, commissionPercent);

    const product = await Product.create({
      sellerId: req.user.id,
      name,
      description: description || '',
      basePrice,
      commissionPercent,
      price: finalPrice,
      stock: stock || 0,
      category: category || 'general',
      image: imgArr[0] || '',
      images: imgArr,
      flashSaleStart: flashSaleStart || null,
      flashSaleEnd: flashSaleEnd || null,
      flashSalePercent: flashSalePercent ?? null,
      bulkPriceTiers: Array.isArray(bulkPriceTiers) ? bulkPriceTiers : [],
      freeShipping: !!freeShipping,
    });

    // Charge platform listing commission against the seller. This is
    // intentionally fire-and-forget on the response: a commission failure
    // should not prevent the product from going live.
    chargeListingFee({ sellerId: req.user.id, product }).catch((err) =>
      console.error('[commission] failed to record listing fee', err)
    );

    res.status(201).json({ product });
  })
);

router.put(
  '/:id',
  protect,
  requireRole('seller'),
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ where: { id: req.params.id, sellerId: req.user.id } });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const allowed = ['name', 'description', 'stock', 'category', 'isActive',
                     'flashSaleStart', 'flashSaleEnd', 'flashSalePercent',
                     'bulkPriceTiers', 'freeShipping'];
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) product[f] = req.body[f];
    });
    // Re-compute price/basePrice on every save so the buyer-facing value stays
    // in sync with the seller's input + the latest commission %.
    if (req.body.price !== undefined) {
      const settings = await Settings.getSingleton();
      const pct = Number(settings.commissionPercent) || 0;
      const base = Number(req.body.price) || 0;
      product.basePrice = base;
      product.commissionPercent = pct;
      product.price = computeFinalPrice(base, pct);
    }
    if (req.body.images !== undefined) {
      const imgArr = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [];
      product.image = imgArr[0] || '';
      product.images = imgArr;
    }
    await product.save();
    res.json({ product });
  })
);

router.delete(
  '/:id',
  protect,
  requireRole('seller'),
  asyncHandler(async (req, res) => {
    const n = await Product.destroy({ where: { id: req.params.id, sellerId: req.user.id } });
    if (!n) return res.status(404).json({ message: 'Product not found' });
    res.json({ ok: true });
  })
);

export default router;
