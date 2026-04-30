import 'dotenv/config';

// Helper that throws a friendly error if a required Supabase env var is missing.
const required = (name) => {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `[env] Missing ${name}. Copy server/.env.example to server/.env and fill in your Supabase credentials.`
    );
  }
  return v;
};

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),

  // ---- Postgres / Supabase --------------------------------------------------
  // Full Postgres connection string from Supabase ⚙ Project Settings → Database
  // → Connection string → URI. Looks like:
  //   postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
  // Use the *pooler* (port 6543) for serverless / nodemon dev — it's connection-safe.
  DATABASE_URL: required('DATABASE_URL'),
  DB_SSL: (process.env.DB_SSL || 'true').toLowerCase() !== 'false', // Supabase requires SSL

  // ---- Supabase JS client (used for Storage uploads) -----------------------
  SUPABASE_URL: required('SUPABASE_URL'),
  // Service-role key has full bucket access — keep it server-side only.
  SUPABASE_SERVICE_ROLE_KEY: required('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_BUCKET_PRODUCTS: process.env.SUPABASE_BUCKET_PRODUCTS || 'product-images',
  SUPABASE_BUCKET_BANNERS:  process.env.SUPABASE_BUCKET_BANNERS  || 'banner-images',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  STOREFRONT_URL: process.env.STOREFRONT_URL || 'http://localhost:5173',

  // Firebase Admin (Google sign-in verification). All three required to enable.
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'weynishop',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  // Service-account PEM (begins with "-----BEGIN PRIVATE KEY-----"). Leave empty
  // to disable Firebase Admin token verification on the server.
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
