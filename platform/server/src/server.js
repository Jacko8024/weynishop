import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { sequelize, Settings, CommissionLedger } from './models/index.js';
import { errorHandler, notFound } from './middleware/error.js';

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

import { registerSocketHandlers } from './sockets/index.js';

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: env.CLIENT_URL, credentials: true },
});

// expose io to routes via app.locals
app.locals.io = io;

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

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
  try {
    await Settings.sync({ alter: true });
    await CommissionLedger.sync({ alter: true });
  } catch (e) {
    console.warn('[migrate] commission schema sync warning:', e.message);
  }
  server.listen(env.PORT, () => {
    console.log(`[api] listening on http://localhost:${env.PORT}`);
  });
};

start().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
