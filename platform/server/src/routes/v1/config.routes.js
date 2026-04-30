import { Router } from 'express';

const router = Router();

// Public, unauthenticated config that the frontend may need at boot.
// NEVER expose anything sensitive here (keys, secrets, etc.).
router.get('/public', (_req, res) => {
  res.json({
    storefrontUrl: process.env.STOREFRONT_URL || '',
  });
});

export default router;
