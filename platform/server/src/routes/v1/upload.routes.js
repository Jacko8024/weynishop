import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import sharp from 'sharp';
import { protect, requireRole } from '../../middleware/auth.js';
import { uploadToBucket } from '../../lib/supabase.js';
import { env } from '../../config/env.js';

// Standard product image size (square cover crop, no stretching).
const PRODUCT_W = 800;
const PRODUCT_H = 800;
// Banner is wide.
const BANNER_W = 1600;
const BANNER_H = 600;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per image
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|webp|gif|avif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = Router();

// Cover-crop in memory using sharp, then push the WEBP buffer to Supabase
// Storage. Returns the public URL of the stored object.
const processAndStore = async ({ buffer, width, height, bucket, prefix }) => {
  const out = await sharp(buffer)
    .rotate() // honor EXIF orientation
    .resize(width, height, { fit: 'cover', position: 'attention' })
    .webp({ quality: 86 })
    .toBuffer();

  const key = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  return uploadToBucket({ bucket, key, buffer: out, contentType: 'image/webp' });
};

// POST /api/v1/uploads/products — multiple images, normalised to 800x800 cover-crop
router.post(
  '/products',
  protect,
  requireRole('seller', 'admin'),
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ message: 'No files uploaded' });
    const out = [];
    for (const f of files) {
      const url = await processAndStore({
        buffer: f.buffer,
        width: PRODUCT_W,
        height: PRODUCT_H,
        bucket: env.SUPABASE_BUCKET_PRODUCTS,
        // Group uploads by seller for easy moderation in the Supabase UI.
        prefix: `seller-${req.user.id}/`,
      });
      out.push(url);
    }
    res.status(201).json({ urls: out });
  })
);

// POST /api/v1/uploads/banners — single banner image, 1600x600 cover-crop
router.post(
  '/banners',
  protect,
  requireRole('admin'),
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const url = await processAndStore({
      buffer: req.file.buffer,
      width: BANNER_W,
      height: BANNER_H,
      bucket: env.SUPABASE_BUCKET_BANNERS,
      prefix: '',
    });
    res.status(201).json({ url });
  })
);

// Multer / Supabase error formatter — keeps API responses consistent.
router.use((err, _req, res, next) => {
  if (err && (err instanceof multer.MulterError || err.message === 'Only image files are allowed')) {
    return res.status(400).json({ message: err.message });
  }
  // Surface Supabase Storage errors with their original message.
  if (err && err.statusCode && err.message) {
    return res.status(Number(err.statusCode) || 500).json({ message: err.message });
  }
  return next(err);
});

export default router;
