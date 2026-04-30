import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { api } from '../../api/client.js';
import { CATEGORIES } from '../../lib/format.js';
import ProductGrid from '../../components/ProductGrid.jsx';
import ProductCard from '../../components/ProductCard.jsx';
import FlashCountdown from '../../components/FlashCountdown.jsx';

const BANNERS = [
  { title: 'Local. Fresh. Delivered.', subtitle: 'Cash on delivery across Ethiopia.',
    cta: 'Shop now', href: '/search',
    img: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=1600',
    bg: 'from-brand-700 to-brand-500' },
  { title: 'Flash Deals up to 30% off', subtitle: 'Limited time. While stock lasts.',
    cta: 'See deals', href: '/deals',
    img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600',
    bg: 'from-flash to-brand-600' },
  { title: 'Verified sellers only', subtitle: 'Quality you can trust, every time.',
    cta: 'Explore stores', href: '/search?verifiedSeller=1',
    img: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600',
    bg: 'from-accent-600 to-accent-400' },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [bannerIdx, setBannerIdx] = useState(0);
  const [flash, setFlash] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-rotate banner every 5s
  useEffect(() => {
    const id = setInterval(() => setBannerIdx((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(id);
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
      {/* Banner carousel */}
      <section className="relative rounded-2xl overflow-hidden h-44 md:h-72">
        {BANNERS.map((b, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-500 bg-gradient-to-br ${b.bg}
                        ${i === bannerIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <img src={b.img} alt="" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />
            <div className="relative h-full flex flex-col justify-center px-6 md:px-12 text-white max-w-xl">
              <h1 className="text-2xl md:text-4xl font-extrabold drop-shadow font-localized">{b.title}</h1>
              <p className="mt-2 text-sm md:text-base opacity-95">{b.subtitle}</p>
              <Link to={b.href} className="btn-accent mt-4 self-start text-sm md:text-base">{b.cta}</Link>
            </div>
          </div>
        ))}
        <button
          onClick={() => setBannerIdx((i) => (i - 1 + BANNERS.length) % BANNERS.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-white/30 hover:bg-white/50 text-white"
          aria-label="Previous"
        ><ChevronLeft size={20} /></button>
        <button
          onClick={() => setBannerIdx((i) => (i + 1) % BANNERS.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded-full bg-white/30 hover:bg-white/50 text-white"
          aria-label="Next"
        ><ChevronRight size={20} /></button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button key={i} onClick={() => setBannerIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                    aria-label={`Banner ${i + 1}`} />
          ))}
        </div>
      </section>

      {/* Categories strip */}
      <section>
        <div className="flex gap-3 md:gap-6 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((c) => (
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
