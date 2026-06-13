import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { Product } from '../../models/Product.js';
import { env } from '../../config/env.js';

const router = Router();

const BASE = env.STOREFRONT_URL || 'https://www.weynishop.com';

const STATIC_PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/search', priority: '0.8', changefreq: 'daily' },
  { loc: '/deals', priority: '0.8', changefreq: 'daily' },
  { loc: '/wishlist', priority: '0.4', changefreq: 'weekly' },
  { loc: '/about', priority: '0.5', changefreq: 'monthly' },
  { loc: '/contact', priority: '0.5', changefreq: 'monthly' },
  { loc: '/faq', priority: '0.5', changefreq: 'monthly' },
  { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
  { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { loc: '/login', priority: '0.3', changefreq: 'monthly' },
  { loc: '/register', priority: '0.3', changefreq: 'monthly' },
];

const url = (loc, priority = '0.5', changefreq = 'weekly') =>
  `  <url>\n    <loc>${BASE}${loc}</loc>\n    <priority>${priority}</priority>\n    <changefreq>${changefreq}</changefreq>\n  </url>`;

router.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const products = await Product.findAll({
      where: { isActive: true, stock: { [Op.gt]: 0 } },
      attributes: ['id', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 50000,
    });

    const productUrls = products.map((p) =>
      url(`/product/${p.id}`, '0.6', 'daily')
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PAGES.map((p) => url(p.loc, p.priority, p.changefreq)).join('\n')}
${productUrls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  })
);

export default router;
