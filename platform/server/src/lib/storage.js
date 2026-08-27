import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

// =============================================================================
// Local disk storage for uploaded files.
//
// Files are written to UPLOADS_DIR/<bucket>/<key> and served publicly by
// Express under /uploads/* (see server.js). In production (Coolify) a
// persistent volume is mounted at /app/uploads so files survive redeploys.
//
// This module keeps the exact call signature of the old Supabase Storage
// helper (`uploadToBucket`), so upload routes and seed scripts don't care
// where the bytes actually live.
// =============================================================================

const rootDir = () => path.resolve(env.UPLOADS_DIR);

// Prevent path traversal — the resolved path must stay inside UPLOADS_DIR.
const resolveFilePath = (bucket, key) => {
  const root = rootDir();
  const full = path.resolve(root, bucket, key);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error('Invalid storage key');
  }
  return full;
};

/**
 * Store a Buffer under UPLOADS_DIR/<bucket>/<key> and return its public URL,
 * e.g. `${PUBLIC_API_URL}/uploads/product-images/seller-1/169...-abc123.webp`.
 *
 * `contentType` is accepted for signature compatibility; the MIME type is
 * inferred from the file extension by express.static when the file is served
 * (all keys we generate carry a proper extension).
 */
export const uploadToBucket = async ({ bucket, key, buffer }) => {
  const filePath = resolveFilePath(bucket, key);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  const base = (env.PUBLIC_API_URL || '').replace(/\/+$/, '');
  const urlKey = `${bucket}/${key}`.replace(/\\/g, '/');
  return `${base}/uploads/${urlKey}`;
};