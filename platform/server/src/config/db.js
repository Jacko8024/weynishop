import { Sequelize } from 'sequelize';
import { env } from './env.js';

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
  },
  pool: { max: 10, min: 0, idle: 10000 },
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[db] connected: mysql://${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
  } catch (err) {
    console.error('\n[db] ❌ Could not connect to MySQL.');
    console.error('[db]    Reason:', err.message);
    console.error('\n  → Is XAMPP MySQL running? (Start it from the XAMPP control panel)');
    console.error(`  → Does the database "${env.DB_NAME}" exist?`);
    console.error('     Open phpMyAdmin → New → name it "weynshop" → Create');
    console.error('  → Are DB_USER / DB_PASS in server/.env correct? (XAMPP default is root with no password)\n');
    process.exit(1);
  }
};
