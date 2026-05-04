import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { Settings } from '../../models/Settings.js';

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

export default router;
