/**
 * Bulk-import script: creates categories, seller accounts, uploads images &
 * creates products for Zeha Yetebeb Albasat and Frita.
 *
 * Usage:
 *   1. Ensure server .env has a valid DATABASE_URL
 *   2. Run:  node src/seed-bulk.js
 *
 * The script uses the server's own models & local storage module directly.
 */
import 'dotenv/config';
import { sequelize, User, Product, Category } from './models/index.js';
import { connectDB } from './config/db.js';
import { uploadToBucket } from './lib/storage.js';
import { env } from './config/env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration ────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '../../');  // weynishop-main root

const BRANDS = [
  {
    name: 'Zeha Yetebeb Albasat',
    email: 'zeha@weynishop.com',
    password: 'Zeha@2026!',
    shopName: 'Zeha Yetebeb Albasat',
    category: 'zeha-yetebeb-albasat',
    categoryLabel: 'ዘሀ የጥበብ ልብስ',
    categoryEmoji: '🎨',
    folder: 'zeha-yetebeb-albasat',
    imagePrefix: 'zeha',
    price: 1500,
    stock: 10,
    description: 'Traditional Ethiopian art clothing — Zeha Yetebeb Albasat. Handcrafted with cultural heritage.',
  },
  {
    name: 'Frita',
    email: 'frita@weynishop.com',
    password: 'Frita@2026!',
    shopName: 'Frita',
    category: 'frita',
    categoryLabel: 'ፍሪታ',
    categoryEmoji: '👕',
    folder: 'frita',
    imagePrefix: 'frita',
    price: 800,
    stock: 15,
    description: 'Frita fashion — modern Ethiopian style clothing.',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Upload a local image file to storage, return public URL */
const uploadImage = async (filePath, bucket, prefix) => {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const key = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return uploadToBucket({ bucket, key, buffer, contentType });
};

// ── Main ─────────────────────────────────────────────────────────────────────

const run = async () => {
  await connectDB();
  console.log('Connected to DB\n');

  for (const brand of BRANDS) {
    console.log(`\n═══════════════════════════════════════`);
    console.log(`  Processing: ${brand.name}`);
    console.log(`═══════════════════════════════════════`);

    // 1. Create or find category
    let cat = await Category.findOne({ where: { key: brand.category } });
    if (!cat) {
      cat = await Category.create({
        key: brand.category,
        label: brand.categoryLabel,
        emoji: brand.categoryEmoji,
        displayOrder: 50,
        isActive: true,
      });
      console.log(`  ✓ Category created: ${brand.categoryLabel}`);
    } else {
      console.log(`  ✓ Category already exists: ${brand.categoryLabel}`);
    }

    // 2. Create or find seller account
    let seller = await User.findOne({ where: { email: brand.email } });
    if (!seller) {
      seller = await User.create({
        name: brand.name,
        email: brand.email,
        password: brand.password,
        role: 'seller',
        status: 'active',
        shopName: brand.shopName,
      });
      console.log(`  ✓ Seller created: ${brand.email} / ${brand.password}`);
    } else {
      console.log(`  ✓ Seller already exists: ${brand.email}`);
    }

    // 3. Collect unique images from folder
    const folderPath = path.join(ROOT, brand.folder);
    if (!fs.existsSync(folderPath)) {
      console.log(`  ✗ Folder not found: ${folderPath}`);
      continue;
    }

    const allFiles = fs.readdirSync(folderPath)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();

    // Deduplicate by file size (keep first occurrence)
    const seen = new Set();
    const uniqueFiles = [];
    for (const f of allFiles) {
      const fp = path.join(folderPath, f);
      const size = fs.statSync(fp).size;
      if (!seen.has(size)) {
        seen.add(size);
        uniqueFiles.push(f);
      }
    }

    console.log(`  ✓ Found ${uniqueFiles.length} unique images`);

    // 4. Upload each image & create a product
    let count = 0;
    for (const fileName of uniqueFiles) {
      // Skip logo files — use as product images if you want
      if (/logo/i.test(fileName)) {
        console.log(`  - Skipping logo: ${fileName}`);
        continue;
      }

      const filePath = path.join(folderPath, fileName);
      const productName = `${brand.name} ${fileName.replace(/\.\w+$/, '').replace(/^zeha\s*/i, '').trim()}`;

      try {
        const url = await uploadImage(
          filePath,
          env.UPLOAD_FOLDER_PRODUCTS,
          `seller-${seller.id}/`
        );
        console.log(`  ↑ Uploaded: ${fileName}`);

        // Check if product with same image URL already exists
        const exists = await Product.findOne({ where: { image: url } });
        if (exists) {
          console.log(`  - Already exists: ${productName}`);
          continue;
        }

        await Product.create({
          sellerId: seller.id,
          name: productName,
          description: brand.description,
          basePrice: brand.price,
          price: brand.price,
          stock: brand.stock,
          category: brand.category,
          image: url,
          images: [url],
          isActive: true,
        });
        count++;
        console.log(`  ✓ Product created: ${productName}`);
      } catch (err) {
        console.error(`  ✗ Failed for ${fileName}: ${err.message}`);
      }

      // Small delay between uploads
      await wait(200);
    }

    console.log(`  → ${count} products created for ${brand.name}`);
  }

  console.log('\n═══════════════════════════════════════');
  console.log('  Bulk import complete!');
  console.log('═══════════════════════════════════════\n');

  await sequelize.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
