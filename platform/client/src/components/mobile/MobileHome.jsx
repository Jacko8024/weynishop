import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeroSlider from '../HeroSlider.jsx';
import MobileCategoryScroller from './MobileCategoryScroller.jsx';
import MobileFlashDeals from './MobileFlashDeals.jsx';
import MobileProductCard from './MobileProductCard.jsx';
import { getRecentlyViewed } from '../../lib/recentlyViewed.js';
import { usePrice } from '../../store/currency.js';

function SectionHeader({ title, to }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-3 pt-4 pb-2">
      <h2 className="font-bold text-[15px] font-localized">{title}</h2>
      {to && (
        <Link to={to} className="text-xs font-semibold" style={{ color: 'var(--color-brand)' }}>
          {t('flashSale.viewAll')} ›
        </Link>
      )}
    </div>
  );
}

/** Compact product tile for horizontal rails (Food / Groceries / Recent). */
function RailCard({ product }) {
  const price = usePrice();
  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const isFlash = !!product.flashSaleActive;
  return (
    <Link to={`/product/${product._id}`} className="w-[118px] shrink-0 press" aria-label={product.name}>
      <div className="relative w-[118px] h-[118px] rounded-xl overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        {images[0] ? (
          <img src={images[0]} alt={product.name} width="236" height="236"
            className="w-full h-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full grid place-items-center text-2xl">📦</div>
        )}
        {isFlash && product.flashSalePercent > 0 && (
          <span className="absolute bottom-0 left-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-tr-lg"
            style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
            -{Math.round(Number(product.flashSalePercent))}%
          </span>
        )}
      </div>
      <div className="mt-1 text-[11px] leading-tight line-clamp-2 min-h-[2.4em] font-localized"
        style={{ color: 'var(--color-text)' }}>
        {product.name}
      </div>
      <div className="price-num text-[13px] font-bold mt-0.5"
        style={{ color: isFlash ? 'var(--color-flash)' : 'var(--color-brand)' }}>
        {price.fmt(isFlash ? product.flashSalePrice : product.price)}
      </div>
    </Link>
  );
}

function Rail({ items }) {
  return (
    <div className="mobile-rail no-scrollbar px-3 pb-1 flex gap-2.5">
      {items.map((p) => <RailCard key={p._id} product={p} />)}
    </div>
  );
}

function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="aspect-square skeleton" />
          <div className="p-2 space-y-1.5">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-2/3" />
            <div className="skeleton h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Dedicated mobile home experience — content-dense, no dead space.
 * Order: banner → categories → popular → food → groceries → deals →
 * recently viewed → recommended. Every section uses real backend data;
 * empty sections are hidden (no fake products).
 * Receives already-fetched data from HomePage (single source of API calls).
 */
export default function MobileHome({ banners, flash, trending, food, groceries, foodKey, groceryKey, loading }) {
  const { t } = useTranslation();
  const [recent] = useState(() => getRecentlyViewed());

  return (
    <div className="pb-4">
      {/* Promotional banner (admin-managed, reused) */}
      <div className="px-3 pt-3">
        <HeroSlider slides={banners} />
      </div>

      {/* Categories */}
      <MobileCategoryScroller />

      {/* Popular — top-selling products (no geo ranking in the backend,
          so this is honestly labelled "Popular", not "near you") */}
      {!loading && trending.length > 0 && (
        <>
          <SectionHeader title={t('mobile.popular')} to="/search?sort=mostSold" />
          <div className="grid grid-cols-2 gap-2.5 px-3">
            {trending.slice(0, 4).map((p) => (
              <MobileProductCard key={p._id} product={p} />
            ))}
          </div>
        </>
      )}

      {/* Food — real products from a food-like category (hidden if none) */}
      {!loading && food.length > 0 && (
        <>
          <SectionHeader title={t('mobile.food')} to={foodKey ? `/search?category=${foodKey}` : '/search'} />
          <Rail items={food} />
        </>
      )}

      {/* Groceries — real grocery products (hidden if none) */}
      {!loading && groceries.length > 0 && (
        <>
          <SectionHeader title={t('mobile.groceries')} to={`/search?category=${groceryKey || 'grocery'}`} />
          <Rail items={groceries} />
        </>
      )}

      {/* Deals — existing flash-sale data only (no fabricated discounts) */}
      {loading ? (
        <div className="px-3 py-3 flex gap-2.5 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[108px]">
              <div className="w-[108px] h-[108px] rounded-xl skeleton" />
              <div className="skeleton h-3 w-16 mx-auto mt-1.5" />
            </div>
          ))}
        </div>
      ) : (
        <MobileFlashDeals products={flash} />
      )}

      {/* Recently viewed — local history, hidden when empty */}
      {!loading && recent.length > 0 && (
        <>
          <SectionHeader title={t('mobile.recentlyViewed')} />
          <Rail items={recent} />
        </>
      )}

      {/* Recommended — more for you */}
      {!loading && trending.length > 4 && (
        <>
          <SectionHeader title={t('mobile.moreForYou')} />
          <div className="grid grid-cols-2 gap-2.5 px-3">
            {trending.slice(4).map((p) => (
              <MobileProductCard key={p._id} product={p} />
            ))}
          </div>
        </>
      )}

      {/* Loading skeleton */}
      {loading && (
        <>
          <SectionHeader title={t('mobile.popular')} />
          <GridSkeleton count={6} />
        </>
      )}
    </div>
  );
}
