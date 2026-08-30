import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Settings } from '../../models/Settings.js';
import { Currency, BASE_CURRENCY } from '../../models/Currency.js';

const router = Router();

// Public, unauthenticated config that the frontend may need at boot.
// NEVER expose anything sensitive here (keys, secrets, etc.).
router.get(
  '/public',
  asyncHandler(async (_req, res) => {
    const s = await Settings.getSingleton();
    res.json({
      storefrontUrl: process.env.STOREFRONT_URL || '',
      // Buyer-facing commission % applied on top of seller base prices.
      // The seller form uses this to show the live final-price preview.
      commissionPercent: Number(s.commissionPercent) || 0,
    });
  })
);

// Public currency configuration: the admin-controlled exchange-rate table
// (spec §17). Clients use this to DISPLAY prices in the user's chosen
// currency; orders themselves are always placed in the stored base ETB.
router.get(
  '/currency',
  asyncHandler(async (_req, res) => {
    const rows = await Currency.findAll({
      where: { active: true },
      order: [['sortOrder', 'ASC'], ['code', 'ASC']],
    });
    res.json({
      base: BASE_CURRENCY,
      currencies: rows.map((c) => ({
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        rateToBase: Number(c.rateToBase),
        decimals: c.decimals,
      })),
    });
  })
);

export default router;
