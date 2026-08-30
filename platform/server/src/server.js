import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { sequelize, Settings, CommissionLedger, DeliveryEarning, SellerEarning, OrderItem, User, Product, Banner, Category, ContactInquiry, SurpriseBooking, SurpriseService } from './models/index.js';
import { DeviceToken } from './models/DeviceToken.js';
import { Notification } from './models/Notification.js';
import { errorHandler, notFound } from './middleware/error.js';
import { backfillDeliveredCommissions } from './services/commission.service.js';
import { backfillWalletsForDelivered } from './services/wallet.service.js';
import { seedSurpriseServices } from './services/surprise.seed.js';
import { VendorProfile } from './models/VendorProfile.js';
import { DeliveryProfile } from './models/DeliveryProfile.js';

import authRoutes from './routes/v1/auth.routes.js';
import userRoutes from './routes/v1/user.routes.js';
import productRoutes from './routes/v1/product.routes.js';
import orderRoutes from './routes/v1/order.routes.js';
import deliveryRoutes from './routes/v1/delivery.routes.js';
import adminRoutes from './routes/v1/admin.routes.js';
import wishlistRoutes from './routes/v1/wishlist.routes.js';
import reviewRoutes from './routes/v1/review.routes.js';
import questionRoutes from './routes/v1/question.routes.js';
import storeRoutes from './routes/v1/store.routes.js';
import sellerCommissionRoutes from './routes/v1/seller.commission.routes.js';
import adminCommissionRoutes from './routes/v1/admin.commission.routes.js';
import configRoutes from './routes/v1/config.routes.js';
import bannerRoutes from './routes/v1/banner.routes.js';
import categoryRoutes from './routes/v1/category.routes.js';
import uploadRoutes from './routes/v1/upload.routes.js';
import contactRoutes from './routes/v1/contact.routes.js';
import sitemapRoutes from './routes/v1/sitemap.routes.js';
import surpriseRoutes from './routes/v1/surprise.routes.js';
import notificationRoutes from './routes/v1/notification.routes.js';

import { registerSocketHandlers } from './sockets/index.js';

const app = express();
const server = http.createServer(app);

// CLIENT_URL may be a single origin or a comma-separated list (e.g.
// "https://www.weynishop.com,http://localhost:5173"). Vercel preview
// deploys also need to be allow-listed via PREVIEW pattern.
//
// Capacitor mobile apps (the WeyniShop Android/iOS app) do NOT load from
// CLIENT_URL — the WebView serves the bundle from a fixed virtual origin:
//   Android:  https://localhost      (default scheme)
//   iOS:      capacitor://localhost  (or ionic://localhost on Ionic)
// If those origins are not admitted, every API call from the APK/IPA fails
// CORS and the mobile app shows no products. A website cannot spoof its
// Origin header, so allow-listing these is safe.
const MOBILE_ORIGINS = new Set([
  'http://localhost', // Capacitor < 5 on Android
  'https://localhost', // Capacitor 5+ on Android
  'capacitor://localhost', // Capacitor on iOS
  'ionic://localhost', // Ionic-portaled builds
]);
const allowedOrigins = (env.CLIENT_URL || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Auto-accept the www <-> apex variant of every allow-listed origin, so
// "https://www.weynishop.com" also admits "https://weynishop.com" (and vice
// versa). Prevents the classic CORS outage where the site is served on both
// hostnames but CLIENT_URL lists only one of them.
const originVariants = new Set(allowedOrigins);
for (const o of allowedOrigins) {
  try {
    const u = new URL(o);
    if (u.hostname.startsWith('www.')) {
      u.hostname = u.hostname.slice(4); // www.example.com -> example.com
    } else {
      u.hostname = `www.${u.hostname}`; // example.com -> www.example.com
    }
    originVariants.add(u.origin);
  } catch {
    // not a parseable absolute URL — skip variant generation
  }
}

const corsOriginCheck = (origin, cb) => {
  // Same-origin / curl / server-to-server requests have no Origin header.
  if (!origin) return cb(null, true);
  // Capacitor hybrid app WebViews (mobile app) — always allowed.
  if (MOBILE_ORIGINS.has(origin)) return cb(null, true);
  if (originVariants.has(origin)) return cb(null, true);
  // Allow any *.vercel.app preview when CLIENT_URL contains a vercel domain,
  // so PR previews don't 401 on every push.
  const allowVercelPreviews = allowedOrigins.some((o) => o.includes('vercel.app'));
  if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) {
    return cb(null, true);
  }
  return cb(new Error(`CORS: origin ${origin} not allowed`));
};

const io = new SocketServer(server, {
  cors: { origin: corsOriginCheck, credentials: true },
});

// expose io to routes via app.locals
app.locals.io = io;

app.use(cors({ origin: corsOriginCheck, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// Uploaded images/documents are stored on local disk (UPLOADS_DIR) and served
// publicly here. In production UPLOADS_DIR is a persistent volume mounted at
// /app/uploads (Coolify → Storages), so files survive redeploys.
app.use('/uploads', express.static(env.UPLOADS_DIR, { maxAge: '7d', immutable: true }));

app.get('/api/v1/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/seller/commission', sellerCommissionRoutes);
app.use('/api/v1/admin/commission', adminCommissionRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/surprise', surpriseRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use(sitemapRoutes);

app.use(notFound);
app.use(errorHandler);

registerSocketHandlers(io);

const start = async () => {
  await connectDB();
  // create/sync tables in dev — safe (no force).
  await sequelize.sync({ alter: false });
  // Targeted alter for models whose schema was extended after initial deploy:
  // - Settings: added listingCommissionType / listingCommissionValue / commissionCurrency
  // - CommissionLedger: new table (sync() above creates it, alter is a no-op safety net)
  // alter:true on a small, well-known model is safe; it never drops data, only adds
  // missing columns / indexes.
  // Each model alter is wrapped individually so one failure (e.g. a flaky
  // MySQL JSON-column ALTER) cannot prevent the API from coming up.
  const safeAlter = async (label, model) => {
    try { await model.sync({ alter: true }); }
    catch (e) { console.warn(`[migrate] ${label} alter skipped:`, e.message); }
  };
  await safeAlter('User', User);            // adds firebaseUid + photoUrl
  await safeAlter('Settings', Settings);
  await safeAlter('CommissionLedger', CommissionLedger);
  await safeAlter('Product', Product);         // adds basePrice + commissionPercent
  await safeAlter('OrderItem', OrderItem);       // adds basePriceSnapshot + commissionPercentSnapshot + commissionAmountSnapshot
  await safeAlter('DeliveryEarning', DeliveryEarning); // courier wallet
  await safeAlter('SellerEarning', SellerEarning);   // seller wallet
  await safeAlter('Banner', Banner);
  await safeAlter('Category', Category);
  await safeAlter('ContactInquiry', ContactInquiry);
  await safeAlter('VendorProfile', VendorProfile);
  await safeAlter('DeliveryProfile', DeliveryProfile);
  await safeAlter('SurpriseBooking', SurpriseBooking);
  await safeAlter('SurpriseService', SurpriseService);
  await safeAlter('DeviceToken', DeviceToken);     // push notifications (device_tokens)
  await safeAlter('Notification', Notification);   // in-app notifications (notifications)

  // One-time backfill: any pre-existing product rows have basePrice = 0 from
  // the column default. Initialise them to the current price so seller
  // dashboards and edits don't reset prices to zero on first save.
  try {
    // Postgres folds unquoted identifiers to lowercase, so the camelCase
    // columns must be double-quoted here. Sequelize quotes automatically
    // everywhere except in raw queries like this one.
    await sequelize.query(
      'UPDATE products SET "basePrice" = price WHERE "basePrice" = 0 AND price > 0'
    );
  } catch (e) {
    console.warn('[migrate] basePrice backfill skipped:', e.message);
  }

  // Backfill sale-commission ledger rows for any order that already reached
  // 'delivered_paid' before this feature shipped. Idempotent — safe every boot.
  try {
    await backfillDeliveredCommissions();
  } catch (e) {
    console.warn('[migrate] commission backfill skipped:', e.message);
  }

  // Backfill seller / courier wallets for past delivered orders.
  try {
    await backfillWalletsForDelivered();
  } catch (e) {
    console.warn('[migrate] wallet backfill skipped:', e.message);
  }

  // Seed the surprise service catalog (only when empty — admin edits are kept).
  try {
    await seedSurpriseServices();
  } catch (e) {
    console.warn('[migrate] surprise services seed skipped:', e.message);
  }

  server.listen(env.PORT, () => {
    console.log(`[api] listening on http://localhost:${env.PORT}`);
  });
};

start().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
