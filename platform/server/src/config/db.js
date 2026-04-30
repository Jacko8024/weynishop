import { Sequelize } from 'sequelize';
import { env } from './env.js';

// Sequelize on Postgres (Supabase). The pooler endpoint requires SSL with
// `rejectUnauthorized: false` because Supabase pooler certs aren't in the
// default Node CA bundle.
export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
    // Quote camelCase identifiers exactly as written so existing column names
    // like firebaseUid / displayOrder / basePrice are preserved on Postgres.
    freezeTableName: false,
  },
  pool: { max: 10, min: 0, idle: 10000 },
  dialectOptions: env.DB_SSL ? { ssl: { require: true, rejectUnauthorized: false } } : {},
});

// Mask the password before logging the connection target.
const safeUrl = () => {
  try {
    const u = new URL(env.DATABASE_URL);
    return `${u.protocol}//${u.username}:***@${u.host}${u.pathname}`;
  } catch { return '(invalid DATABASE_URL)'; }
};

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[db] connected: ${safeUrl()}`);
  } catch (err) {
    console.error('\n[db] ❌ Could not connect to Supabase Postgres.');
    console.error('[db]    Reason:', err.message);
    console.error('\n  → Did you copy server/.env.example to server/.env?');
    console.error('  → Get DATABASE_URL from Supabase → Project Settings → Database → Connection string (URI).');
    console.error('  → Use the *pooler* connection (port 6543) for development.');
    console.error('  → Make sure your IP is allowed (Supabase → Settings → Database → Network restrictions).\n');
    process.exit(1);
  }
};
