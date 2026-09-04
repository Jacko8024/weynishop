/**
 * Utility script to create or reset Google Play reviewer test account in production/staging.
 * Run via: node create_reviewer_account.js
 */
import 'dotenv/config';
import { sequelize } from './src/config/db.js';
import { User } from './src/models/User.js';

const REVIEWER_EMAIL = 'playstore.test@weynishop.com';
const REVIEWER_PASSWORD = 'PlayReviewer2026!';
const REVIEWER_NAME = 'Google Play Reviewer';

async function main() {
  try {
    await sequelize.authenticate();
    console.log('[DB] Connected successfully.');

    let user = await User.findOne({ where: { email: REVIEWER_EMAIL } });
    if (!user) {
      user = await User.create({
        name: REVIEWER_NAME,
        email: REVIEWER_EMAIL,
        password: REVIEWER_PASSWORD,
        role: 'buyer',
        status: 'active',
        phone: '+251911000000',
        defaultAddress: 'Bole Medhanealem, Addis Ababa',
      });
      console.log(`[SUCCESS] Created new Play Store reviewer test account: ${REVIEWER_EMAIL}`);
    } else {
      user.password = REVIEWER_PASSWORD;
      user.status = 'active';
      user.role = 'buyer';
      await user.save();
      console.log(`[SUCCESS] Reset password & active status for existing account: ${REVIEWER_EMAIL}`);
    }

    console.log('\n--- Reviewer Credentials for Google Play Console ---');
    console.log(`Email:    ${REVIEWER_EMAIL}`);
    console.log(`Password: ${REVIEWER_PASSWORD}`);
    console.log('Role:     buyer');
    console.log('----------------------------------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('[ERROR] Failed to create reviewer account:', err);
    process.exit(1);
  }
}

main();
