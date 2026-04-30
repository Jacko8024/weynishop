import 'dotenv/config';
import { sequelize, User, Product, Settings, Review, Banner, Category } from './models/index.js';
import { connectDB } from './config/db.js';

const ACCOUNTS = [
  { role: 'admin', name: 'Platform Admin', email: 'admin@weynshop.test', password: 'Admin@123', status: 'active' },
  {
    role: 'seller',
    name: 'Sample Seller',
    email: 'seller@weynshop.test',
    password: 'Seller@123',
    status: 'active',
    verified: true,
    shopName: 'WeynShop Demo Store',
    storeDescription: 'Locally sourced quality products from across Ethiopia.',
    storeBanner: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=1200',
    pickupLng: 38.7613,
    pickupLat: 9.0227,
    pickupAddress: 'Bole, Addis Ababa',
    followerCount: 1240,
  },
  {
    role: 'buyer',
    name: 'Sample Buyer',
    email: 'buyer@weynshop.test',
    password: 'Buyer@123',
    status: 'active',
    defaultLng: 38.77,
    defaultLat: 9.03,
    defaultAddress: 'Kazanchis, Addis Ababa',
  },
  {
    role: 'delivery',
    name: 'Sample Delivery',
    email: 'delivery@weynshop.test',
    password: 'Delivery@123',
    status: 'active',
    currentLng: 38.765,
    currentLat: 9.025,
  },
];

const inHours = (h) => new Date(Date.now() + h * 3600 * 1000);
const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);

const SAMPLE_PRODUCTS = [
  {
    name: 'Premium Coffee Beans 1kg', price: 850, stock: 40, category: 'grocery',
    description: 'Locally sourced Yirgacheffe Arabica beans, medium roast.\n\n• Single origin\n• Hand picked\n• Roasted weekly',
    images: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',
      'https://images.unsplash.com/photo-1559525323-cbb5269e4497?w=800',
    ],
    soldCount: 1203, ratingAvg: 4.8, ratingCount: 312, freeShipping: true,
    flashSaleStart: hoursAgo(1), flashSaleEnd: inHours(6), flashSalePercent: 25,
    bulkPriceTiers: [{ minQty: 5, price: 800 }, { minQty: 20, price: 720 }],
  },
  {
    name: 'Handwoven Basket', price: 1200, stock: 15, category: 'home',
    description: 'Traditional handcrafted Ethiopian basket. Each piece is unique.',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
    soldCount: 87, ratingAvg: 4.5, ratingCount: 42,
  },
  {
    name: 'Cotton Scarf', price: 600, stock: 30, category: 'fashion',
    description: 'Soft hand-loomed cotton scarf. Multiple colors available.',
    images: [
      'https://images.unsplash.com/photo-1601762603339-fd61e28b698a?w=800',
      'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800',
    ],
    soldCount: 540, ratingAvg: 4.6, ratingCount: 156, freeShipping: true,
  },
  {
    name: 'Honey Jar 500g', price: 450, stock: 60, category: 'grocery',
    description: 'Pure natural highland honey from Tigray apiaries.',
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800'],
    soldCount: 2410, ratingAvg: 4.9, ratingCount: 678, freeShipping: true,
    flashSaleStart: hoursAgo(2), flashSaleEnd: inHours(10), flashSalePercent: 15,
    bulkPriceTiers: [{ minQty: 6, price: 420 }, { minQty: 24, price: 380 }],
  },
  {
    name: 'Leather Wallet', price: 1500, stock: 12, category: 'fashion',
    description: 'Genuine leather, hand-stitched. Ages beautifully with use.',
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800'],
    soldCount: 64, ratingAvg: 4.4, ratingCount: 18,
  },
  {
    name: 'Wireless Earbuds', price: 2400, stock: 25, category: 'electronics',
    description: 'Bluetooth 5.3, 24h battery, IPX5 water resistance.',
    images: [
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800',
    ],
    soldCount: 920, ratingAvg: 4.3, ratingCount: 220,
    flashSaleStart: hoursAgo(0.5), flashSaleEnd: inHours(3), flashSalePercent: 30,
  },
  {
    name: 'Berbere Spice Blend 250g', price: 220, stock: 200, category: 'grocery',
    description: 'Traditional Ethiopian spice blend. Mild heat, deep flavor.',
    images: ['https://images.unsplash.com/photo-1599909533743-bb1f43da4b95?w=800'],
    soldCount: 3120, ratingAvg: 4.85, ratingCount: 412, freeShipping: true,
  },
  {
    name: 'Cast Iron Pan', price: 1800, stock: 8, category: 'home',
    description: 'Pre-seasoned 10-inch cast iron skillet.',
    images: ['https://images.unsplash.com/photo-1544025162-d76694265947?w=800'],
    soldCount: 12, ratingAvg: 4.2, ratingCount: 6,
  },
];

const REVIEWS = [
  { rating: 5, text: 'Best coffee I have had! Smooth and aromatic.' },
  { rating: 5, text: 'Authentic taste, fast delivery. Will buy again.' },
  { rating: 4, text: 'Good quality, packaging could be better.' },
];

const run = async () => {
  await connectDB();
  console.log('Dropping & recreating all tables...');
  await sequelize.sync({ force: true });

  console.log('Creating users...');
  const users = {};
  for (const a of ACCOUNTS) {
    const u = await User.create(a);
    users[a.role] = u;
    console.log(`  ${a.role.padEnd(8)} ${a.email.padEnd(30)} ${a.password}`);
  }

  console.log('Creating settings...');
  const settings = await Settings.create({ commissionPercent: 10 });

  console.log('Creating default categories...');
  const DEFAULT_CATEGORIES = [
    { key: 'grocery',     label: 'Grocery',     emoji: '🛒', displayOrder: 1 },
    { key: 'fashion',     label: 'Fashion',     emoji: '👗', displayOrder: 2 },
    { key: 'electronics', label: 'Electronics', emoji: '📱', displayOrder: 3 },
    { key: 'home',        label: 'Home',        emoji: '🏠', displayOrder: 4 },
    { key: 'beauty',      label: 'Beauty',      emoji: '💄', displayOrder: 5 },
    { key: 'sports',      label: 'Sports',      emoji: '⚽', displayOrder: 6 },
    { key: 'kids',        label: 'Kids',        emoji: '🧸', displayOrder: 7 },
    { key: 'general',     label: 'Other',       emoji: '🎁', displayOrder: 99 },
  ];
  for (const c of DEFAULT_CATEGORIES) await Category.create(c);

  console.log('Creating default banners...');
  const DEFAULT_BANNERS = [
    {
      title: 'Local. Fresh. Delivered.', subtitle: 'Cash on delivery across Ethiopia.',
      imageUrl: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=1600',
      linkUrl: '/search', displayOrder: 1, isActive: true,
    },
    {
      title: 'Flash Deals up to 30% off', subtitle: 'Limited time. While stock lasts.',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600',
      linkUrl: '/deals', displayOrder: 2, isActive: true,
    },
    {
      title: 'Verified sellers only', subtitle: 'Quality you can trust, every time.',
      imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600',
      linkUrl: '/search?verifiedSeller=1', displayOrder: 3, isActive: true,
    },
  ];
  for (const b of DEFAULT_BANNERS) await Banner.create(b);

  console.log('Creating sample products...');
  const pct = Number(settings.commissionPercent) || 0;
  const finalize = (base) => Math.round(base * (1 + pct / 100) * 100) / 100;
  const created = [];
  for (const p of SAMPLE_PRODUCTS) {
    const basePrice = Number(p.price);
    const prod = await Product.create({
      ...p,
      basePrice,
      commissionPercent: pct,
      price: finalize(basePrice),
      sellerId: users.seller.id,
      image: p.images?.[0] || '',
    });
    created.push(prod);
  }

  console.log('Creating sample reviews...');
  for (const r of REVIEWS) {
    await Review.create({
      productId: created[0].id,
      userId: users.buyer.id,
      rating: r.rating,
      text: r.text,
    });
  }

  console.log('\n✓ Seed complete\n');
  await sequelize.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
