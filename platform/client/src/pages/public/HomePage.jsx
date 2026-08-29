import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, Store, Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import { api } from '../../api/client.js';
import { useCategories } from '../../lib/categories.js';
import ProductGrid from '../../components/ProductGrid.jsx';
import ProductCard from '../../components/ProductCard.jsx';
import FlashCountdown from '../../components/FlashCountdown.jsx';
import HeroSlider from '../../components/HeroSlider.jsx';
import useDocumentTitle from '../../lib/useDocumentTitle.js';
import useIsMobile from '../../lib/useIsMobile.js';
import MobileHome from '../../components/mobile/MobileHome.jsx';
import JsonLd, { OrganizationSchema, WebSiteSchema } from '../../components/JsonLd.jsx';

const FALLBACK_BANNERS = [
  {
    title: 'Welcome to WeyniShopping',
    subtitle: 'Local. Fresh. Delivered. Pay with cash on delivery.',
    ctaLabel: 'Shop now',
    linkUrl: '/search',
    imageUrl:
      'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=1600&q=70&auto=format&fit=crop',
  },
];

export default function HomePage() {
  const { t } = useTranslation();
  const categories = useCategories();
  const isMobile = useIsMobile();
  const [banners, setBanners] = useState(FALLBACK_BANNERS);
  const [flash, setFlash] = useState([]);
  const [trending, setTrending] = useState([]);
  const [food, setFood] = useState([]);
  const [groceries, setGroceries] = useState([]);
  const [foodKey, setFoodKey] = useState('');
  const [groceryKey, setGroceryKey] = useState('');
  const [loading, setLoading] = useState(true);

  useDocumentTitle(
    null,
    'WeyniShopping — Ethiopia\'s cash-on-delivery marketplace. Shop local, pay on delivery, fast nationwide shipping.'
  );

  // Load banners (admin-managed) — fall back to default on empty/error
  useEffect(() => {
    let on = true;
    api.get('/banners')
      .then(({ data }) => { if (on && data.items?.length) setBanners(data.items); })
      .catch(() => { });
    return () => { on = false; };
  }, []);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      try {
        const [f, p] = await Promise.all([
          api.get('/products/flash-deals'),
          api.get('/products', { params: { sort: 'mostSold', limit: 20 } }),
        ]);
        if (!on) return;
        setFlash(f.data.items || []);
        setTrending(p.data.items || []);

        // Mobile home rails: Food + Groceries from REAL category data.
        // We discover which category keys actually have products and only
        // render a section when it has real items (no fake inventory).
        if (isMobile) {
          try {
            const { data: catData } = await api.get('/products/categories');
            const keys = Array.isArray(catData.categories) ? catData.categories : [];
            const fk = keys.find((k) => /food|meal|restaurant|ምግብ|ቡና|coffee|injera|berbere|spice/i.test(String(k)));
            const gk = keys.find((k) => k !== fk && /grocer|baltina|ቅመም/i.test(String(k)));
            const reqs = [];
            if (fk) {
              reqs.push(
                api.get('/products', { params: { category: fk, sort: 'mostSold', limit: 8 } })
                  .then(({ data }) => { if (on) { setFood(data.items || []); setFoodKey(fk); } })
                  .catch(() => { })
              );
            }
            if (gk) {
              reqs.push(
                api.get('/products', { params: { category: gk, sort: 'mostSold', limit: 8 } })
                  .then(({ data }) => { if (on) { setGroceries(data.items || []); setGroceryKey(gk); } })
                  .catch(() => { })
              );
            }
            await Promise.all(reqs);
          } catch { /* rails stay hidden */ }
        }
      } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [isMobile]);

  const flashEnd = flash[0]?.flashSaleEnd;

  // Dedicated mobile shopping experience (phones only)
  if (isMobile) {
    return (
      <>
        <JsonLd data={OrganizationSchema} />
        <JsonLd data={WebSiteSchema} />
        <MobileHome
          banners={banners}
          flash={flash}
          trending={trending}
          food={food}
          groceries={groceries}
          foodKey={foodKey}
          groceryKey={groceryKey}
          loading={loading}
        />
      </>
    );
  }

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-4 md:py-6 space-y-8">
      <JsonLd data={OrganizationSchema} />
      <JsonLd data={WebSiteSchema} />
      {/* Hero carousel — admin-managed via /admin/banners */}
      <HeroSlider slides={banners} />


      {/* Categories strip — admin-managed via /admin/categories (label + lucide icon) */}
      <section>
        <div className="flex gap-3 md:gap-6 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.key}
                to={`/search?category=${c.key}`}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
              >
                <span className="w-14 h-14 md:w-16 md:h-16 grid place-items-center rounded-2xl transition group-hover:scale-105"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <Icon size={28} strokeWidth={1.75} className="md:w-8 md:h-8" />
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{c.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Flash deals */}
      {flash.length > 0 && (
        <section className="card p-4 md:p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl grid place-items-center text-white"
                style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
                <Zap size={20} className="fill-white" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold font-localized">{t('flashSale.title')}</h2>
                {flashEnd && (
                  <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    <span>{t('flashSale.endsIn')}</span>
                    <FlashCountdown endAt={flashEnd} compact />
                  </div>
                )}
              </div>
            </div>
            <Link to="/deals" className="text-sm font-medium" style={{ color: 'var(--color-brand)' }}>
              {t('flashSale.viewAll')} →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {flash.slice(0, 10).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* Trending */}
      <section>
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 font-localized">Trending now</h2>
        <ProductGrid products={trending} loading={loading} />
      </section>

      {/* ── Hero About Section ── */}
      <section className="card p-6 md:p-8 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-4 font-localized leading-tight">
          አረብ ሀገር ላሉ ኢትዮጵያውያን የመጀመሪያው ሁሉን አቀፍ የገበያ መድረክ!
        </h2>
        <p className="text-base md:text-lg leading-relaxed max-w-4xl mx-auto" style={{ color: 'var(--color-muted)' }}>
          ከቤት ሳይወጡ የሚፈልጉትን የሀገር ምርቶች፣ ባህላዊ ምግቦች፣ የባልትና ውጤቶች፣ አልባሳት እና የውበት መጠበቂያዎችን በአንድ ቦታ ይግዙ። ሁሉንም በአንድ ላይ አዝዘው በጋራ ዴሊቨሪ ያሉበት ድረስ እናመጣለን። ከተለያዩ ቦታዎች በመግዛት ለተለያየ ዴሊቨሪ የሚያወጡትን አላስፈላጊ ወጪ ያስቀሩ!
        </p>
        <div className="mt-6 max-w-3xl mx-auto" style={{ color: 'var(--color-muted)' }}>
          <p className="text-base md:text-lg leading-relaxed">
            <strong className="text-brand">The First All-in-One Ethiopian Marketplace in Arab Countries!</strong><br />
            Shop authentic Ethiopian foods, traditional spices, clothing, and beauty products from the comfort of your home. Consolidate your purchases into a single order to save on multiple delivery fees! Every product comes with clear benefits and step-by-step usage guides.
          </p>
        </div>
      </section>

      {/* ── Product Categories ── */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold mb-5 text-center font-localized">የምንሰጣቸው አገልግሎቶች</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="card p-5">
            <div className="w-12 h-12 rounded-xl grid place-items-center text-white mb-4" style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
              <ShoppingBag size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">የኢትዮጵያ ባህላዊ ምግቦች (Traditional Meals)</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              ክትፎ፣ ጥብስ፣ ፍርፍር እና ሌሎችም ተወዳጅ ምግቦች ባሉበት ሆነው ያዙ፤ ትኩስነታቸውን ሳይለቁ እናደርሳለን።
            </p>
            <p className="text-xs mt-2 italic" style={{ color: 'var(--color-muted)' }}>
              Freshly prepared Ethiopian dishes like Kitfo, Tibs, Firfir, and more delivered hot to your door.
            </p>
          </div>

          <div className="card p-5">
            <div className="w-12 h-12 rounded-xl grid place-items-center text-white mb-4" style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
              <Store size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">የሀገር ውስጥ የባልትና ውጤቶች (Authentic Baltina &amp; Spices)</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              ንፁህ የአበሻ ሽሮ፣ በርበሬ፣ ሚጥሚጣ፣ በሶ፣ ቆሎ እና ሌሎችም የሀገር ቤት ጣዕሞች።
            </p>
            <p className="text-xs mt-2 italic" style={{ color: 'var(--color-muted)' }}>
              Premium Ethiopian spices, Shiro, Berbere, Besso, Kolo, and kitchen essentials.
            </p>
          </div>

          <div className="card p-5 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-xl grid place-items-center text-white mb-4" style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
              <Truck size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">ዘመናዊ አልባሳት እና ጫማዎች (Fashion, Shoes &amp; Pre-Orders)</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              ከተለያዩ ታማኝ ነጋዴዎች እጅ ላይ ያሉ ዘመናዊ አልባሳት፣ የህፃናት እና የአዋቂዎች ልብሶችና ጫማዎች። በተጨማሪም ከሼን (Shein) ላይ የሚፈልጉትን መርጠው በ30% ቅድመ ክፍያ ብቻ እናስመጣለን!
            </p>
            <p className="text-xs mt-2 italic" style={{ color: 'var(--color-muted)' }}>
              Trending fashion, kids' and adults' wear, and shoes from local merchants. We also offer Shein pre-orders with just a 30% down payment!
            </p>
          </div>
        </div>
      </section>

      {/* ── Partners Section ── */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold mb-5 text-center font-localized">ከእኛ ጋር አብረው ለመስራት</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* For Merchants */}
          <div className="card p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full grid place-items-center text-white mb-4" style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
              <Store size={28} />
            </div>
            <h3 className="font-bold text-xl mb-3">ለነጋዴዎች (For Sellers/Merchants)</h3>
            <ul className="space-y-2 text-sm text-left mb-4" style={{ color: 'var(--color-muted)' }}>
              <li className="flex items-start gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-brand" />
                ምርቶችዎን ለብዙ ሺህ ደንበኞች ያስተዋውቁ!
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-brand" />
                በአረብ ሀገር ያሉ ኢትዮጵያውያን በቀላሉ እንዲያገኟቸው በወይኒገበያ ላይ ነጻ የአቅራቢነት አካውንት ይክፈቱ።
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-brand" />
                የሚሸጧቸውን ምርቶች ፎቶ፣ ዋጋ እና ዝርዝር መግለጫ በማስገባት ሽያጭዎን ዛሬውኑ ያሳድጉ።
              </li>
            </ul>
            <p className="text-xs mb-4 italic" style={{ color: 'var(--color-muted)' }}>
              Register as a merchant, list your products (food, hair care, clothes, or spices), and reach thousands of ready-to-buy customers in your area.
            </p>
            <Link to="/register?role=seller" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Store size={16} /> Register as Seller
            </Link>
          </div>

          {/* For Delivery Drivers */}
          <div className="card p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full grid place-items-center text-white mb-4" style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
              <Truck size={28} />
            </div>
            <h3 className="font-bold text-xl mb-3">ለዴሊቨሪ አቅራቢዎች (For Delivery Drivers)</h3>
            <ul className="space-y-2 text-sm text-left mb-4" style={{ color: 'var(--color-muted)' }}>
              <li className="flex items-start gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-brand" />
                ከትራንስፖርት ስራዎ ተጨማሪ ገቢ ያግኙ!
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-brand" />
                በራስዎ መኪና ወይም ሞተርሳይክል እቃዎችን በማድረስ ተጨማሪ ገቢ ያግኙ።
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight size={16} className="shrink-0 mt-0.5 text-brand" />
                በወይኒገበያ ላይ የዴሊቨሪ አካውንት ይክፈቱ፤ አስፈላጊ መረጃዎችንና ሰነዶችን በማሟላት የስራ ቤተሰባችን ይሁኑ!
              </li>
            </ul>
            <p className="text-xs mb-4 italic" style={{ color: 'var(--color-muted)' }}>
              Sign up as a delivery partner, complete your profile, and start earning by delivering packages to customers near you.
            </p>
            <Link to="/register?role=delivery" className="btn-primary inline-flex items-center gap-2 text-sm">
              <Truck size={16} /> Become a Driver
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
