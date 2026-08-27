import 'dotenv/config';

// Helper that throws a friendly error if a required env var is missing.
const required = (name) => {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `[env] Missing ${name}. Copy server/.env.example to server/.env and fill in your database credentials.`
    );
  }
  return v;
};

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),

  // ---- PostgreSQL (Sequelize) ------------------------------------------------
  // Any PostgreSQL 14+ connection string. Local dev: a local/Docker Postgres.
  // Production (Coolify): the internal connection URL of the Coolify-managed
  // PostgreSQL resource, e.g.
  //   postgres://<user>:<password>@<resource-name>:5432/<db>
  DATABASE_URL: required('DATABASE_URL'),
  // false for local Postgres and Coolify-managed Postgres on the same private
  // network. Set true only for cloud providers that require SSL.
  DB_SSL: (process.env.DB_SSL || 'false').toLowerCase() === 'true',

  // ---- File storage (local disk) ----------------------------------------------
  // Directory where uploaded images/documents are written. In production this
  // MUST be a persistent volume (Coolify: mount a volume at /app/uploads).
  UPLOADS_DIR: process.env.UPLOADS_DIR || './uploads',
  // Public base URL of this API (no trailing slash). Used to build absolute
  // URLs for uploaded files, e.g. https://api.yourdomain.com
  PUBLIC_API_URL: process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`,
  // Folder names under UPLOADS_DIR (historically Supabase bucket names).
  UPLOAD_FOLDER_PRODUCTS: process.env.UPLOAD_FOLDER_PRODUCTS || 'product-images',
  UPLOAD_FOLDER_BANNERS:  process.env.UPLOAD_FOLDER_BANNERS  || 'banner-images',
  UPLOAD_FOLDER_DOCS:     process.env.UPLOAD_FOLDER_DOCS     || 'onboarding-docs',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  STOREFRONT_URL: process.env.STOREFRONT_URL || 'http://localhost:5173',

  // The ONE merchant account (seller user id) that owns the surprise page.
  // It manages the surprise services and booking forms with the same account
  // it uses to sell on the main Weyni shop. Admins always have access too.
  // Leave empty to disable seller management (admin-only).
  SURPRISE_OWNER_ID: (() => {
    const n = Number(process.env.SURPRISE_OWNER_ID || '');
    return Number.isInteger(n) && n > 0 ? n : null;
  })(),

  // Easier alternative to SURPRISE_OWNER_ID: just put the login email of the
  // owner account here and it will be looked up in the Users table at runtime
  // (cached). If SURPRISE_OWNER_ID is set, it wins over this.
  SURPRISE_OWNER_EMAIL: (process.env.SURPRISE_OWNER_EMAIL || '').trim().toLowerCase(),

  // Firebase Admin (Google sign-in verification). All three required to enable.
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'weynishopping',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  // Service-account PEM (begins with "-----BEGIN PRIVATE KEY-----"). Leave empty
  // to disable Firebase Admin token verification on the server.
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
