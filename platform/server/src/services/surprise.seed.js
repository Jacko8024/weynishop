import { SurpriseService } from '../models/index.js';

const SHARED_FEATURES = ['ከእኛ የምናዘጋጀው', 'ኬክ እና ሪችት', '🚚 ከድላይቨሪ ውጪ'];

// The same contents for all 3 Gift Delivery packages — የአንቨርሰሪ, ፕሮፖዝ, ሰርፕራይዝ.
const GIFT_FEATURES = ['ከእኛ የምናዘጋጀው', 'እቅፍ አበባ', 'የፍቅር መልእክት ካርድ', 'ኬክ'];

const GIFT_PACKAGES = [
  { img: '/surprise/4.jpg', name: 'የአንቨርሰሪ', rating: 4.9, price: 50, features: GIFT_FEATURES },
  { img: '/surprise/5.jpg', name: 'የታገቢኛለሽ ፕሮፖዝ ማድረጊያ', rating: 4.8, price: 50, features: GIFT_FEATURES },
  { img: '/surprise/6.jpg', name: 'ሰርፕራይዝ ማድረጊያ', rating: 5.0, price: 50, features: GIFT_FEATURES },
];

// Old generic names that used to be seeded into the Gift Delivery group.
const OLD_GIFT_NAMES = ['Tihun Surprise Team', 'Tihun Events', 'Tihun Surprise'];

const SEED_GROUPS = [
  {
    groupId: 'birthday',
    title: 'ለልደት እና እንዲሁ ሰርፕራይዝ ለማድረግ',
    subtitle:
      'እርሶን ወክለን, ልደት, ምርቃት, ለተለያዮ በአላት ወይንም እንዲሁ ፍቅሮትን ለመግለፅ እርሶን ወክለን ባዘዙን መንገድ እናደርስሎታለን',
    providers: [
      { name: 'Tihun Surprise Team', img: '/surprise/1.1.jpg', rating: 4.9, price: 50, features: SHARED_FEATURES },
      { name: 'Tihun Events', img: '/surprise/2.jpg', rating: 4.8, price: 50, features: SHARED_FEATURES },
      { name: 'Tihun Surprise', img: '/surprise/6.jpg', rating: 5.0, price: 50, features: SHARED_FEATURES },
    ],
  },
  {
    groupId: 'event',
    title: 'ለሀዘን, ለደስታ (ድግስ) ወይንም የታመመ ለመጠየቅ',
    subtitle:
      'በሀገር መራራቅ ምክንያት ለሚወዷቸው ሰዎች ድግስ, ሀዘን ወይንም ህመም ተፈጥሮ እርሶ መምጣት ባይችሉ እንኳን, እርሶ ለወዳጆ ትልቅ ቦታ እንዳሎት እያሰቧቸው እንደሆነ እኛ እርሶን ወክለን ተገኝተንሎት ማሳየት ይችላሉ',
    providers: [
      {
        name: 'Tihun Surprise Team',
        img: '/surprise/7.jpg',
        rating: 4.9,
        price: 125,
        features: ['ለ10 ሰው የሚሆን አገልግል ምግብ', '2 የታሸገ ውሀ ግማሽ ሌትር', '🚚 ከድላይቨሪ ውጪ'],
      },
      {
        name: 'Tihun Events',
        img: '/surprise/8.jpg',
        rating: 4.8,
        price: 125,
        features: ['ለ10 ሰው የሚሆን አገልግል ምግብ', '2 የታሸገ ውሀ ግማሽ ሌትር', '🚚 ከድላይቨሪ ውጪ'],
      },
      {
        name: 'Tihun Surprise',
        img: '/surprise/9.jpg',
        rating: 5.0,
        price: 125,
        features: ['ለ10 ሰው የሚሆን አገልግል ምግብ', '2 የታሸገ ውሀ ግማሽ ሌትር', '🚚 ከድላይቨሪ ውጪ'],
      },
    ],
  },
  {
    groupId: 'gift',
    title: 'ስጦታ ማድረስ (Gift Delivery)',
    subtitle: 'ለፍቅረኛዎ, ለቤተሰብዎ ወይም ለጓደኛዎ ስጦታ በእኛ አማካኝነት ወደ ውድ ሰዎችዎ ያድርሱ',
    providers: [
      { name: 'የአንቨርሰሪ', img: '/surprise/4.jpg', rating: 4.9, price: 50, features: GIFT_FEATURES },
      { name: 'የታገቢኛለሽ ፕሮፖዝ ማድረጊያ', img: '/surprise/5.jpg', rating: 4.8, price: 50, features: GIFT_FEATURES },
      { name: 'ሰርፕራይዝ ማድረጊያ', img: '/surprise/6.jpg', rating: 5.0, price: 50, features: GIFT_FEATURES },
    ],
  },
];

/**
 * Idempotent seeder.
 * – If the table is empty           → insert the 9 canonical rows.
 * – If the table has exactly 9 rows → apply any Gift-package name/content
 *   repairs (admin edits are preserved for other groups).
 * – If the table has MORE than 9 rows (duplicate seeding happened) →
 *   wipe everything and re-insert the canonical 9.  Only the 9 rows seeded
 *   here will survive; any admin-created extras were presumably the
 *   cause of the duplicate display.
 */
export const seedSurpriseServices = async () => {
  const count = await SurpriseService.count();

  // ── Duplicate-guard: too many rows → full reset ─────────────────────────
  if (count > 9) {
    console.log(`[seed] found ${count} surprise services (expected 9) — resetting to canonical 9`);
    await SurpriseService.destroy({ where: {} });
    // fall through to the insert block below
  } else if (count > 0) {
    // Exactly the right number — repair Gift Delivery package metadata only.
    const giftRows = await SurpriseService.findAll({ where: { groupId: 'gift' } });
    for (const row of giftRows) {
      const byImg = GIFT_PACKAGES.find((p) => p.img === row.image);
      const byName = byImg || GIFT_PACKAGES[OLD_GIFT_NAMES.indexOf(row.name)];
      const pack = byName;
      if (!pack) continue;
      const features = Array.isArray(row.features) ? row.features : [];
      if (features.length === 0 || OLD_GIFT_NAMES.includes(row.name)) {
        await row.update({ name: pack.name, rating: pack.rating, price: pack.price, features: pack.features });
        console.log('[seed] gift package updated:', row.id, '->', pack.name);
      } else if (row.price !== pack.price || JSON.stringify(features) !== JSON.stringify(pack.features)) {
        await row.update({ price: pack.price, features: pack.features });
        console.log('[seed] gift package content synced:', row.id, '->', pack.name);
      }
    }
    return;
  }


  const rows = [];
  let order = 0;
  for (const g of SEED_GROUPS) {
    for (const p of g.providers) {
      rows.push({
        groupId: g.groupId,
        groupTitle: g.title,
        groupSubtitle: g.subtitle,
        name: p.name,
        image: p.img,
        rating: p.rating,
        price: p.price,
        features: p.features || [],
        displayOrder: order++,
        isActive: true,
      });
    }
  }
  await SurpriseService.bulkCreate(rows);
  console.log('[seed] inserted', rows.length, 'surprise services');
};

export default seedSurpriseServices;