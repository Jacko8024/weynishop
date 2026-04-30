import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import { api } from '../../api/client.js';
import { useCategories } from '../../lib/categories.js';
import ProductGrid from '../../components/ProductGrid.jsx';
import ProductCard from '../../components/ProductCard.jsx';
import FlashCountdown from '../../components/FlashCountdown.jsx';
import HeroSlider from '../../components/HeroSlider.jsx';
import useDocumentTitle from '../../lib/useDocumentTitle.js';

const FALLBACK_BANNERS = [
  {
    title: 'Welcome to WeyniShop',
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
  const [banners, setBanners] = useState(FALLBACK_BANNERS);
  const [flash, setFlash] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle(
    null,
    'WeyniShop — Ethiopia\'s cash-on-delivery marketplace. Shop local, pay on delivery, fast nationwide shipping.'
  );

  // Load banners (admin-managed) — fall back to default on empty/error
  useEffect(() => {
    let on = true;
    api.get('/banners')
      .then(({ data }) => { if (on && data.items?.length) setBanners(data.items); })
      .catch(() => {});
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
      } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, []);

  const flashEnd = flash[0]?.flashSaleEnd;

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-4 md:py-6 space-y-8">
      {/* Hero carousel — admin-managed via /admin/banners */}
      <HeroSlider slides={banners} />


      {/* Categories strip — admin-managed via /admin/categories (emoji + label) */}
      <section>
        <div className="flex gap-3 md:gap-6 overflow-x-auto no-scrollbar pb-1">
          {categories.map((c) => (
            <Link
              key={c.key}
              to={`/search?category=${c.key}`}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
            >
              <span className="w-14 h-14 md:w-16 md:h-16 grid place-items-center rounded-2xl text-2xl md:text-3xl transition group-hover:scale-105"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                {c.icon}
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{c.label}</span>
            </Link>
          ))}
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
    </div>
  );
}
