import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/auth.js';
import { useWishlist } from '../../store/wishlist.js';
import { useLoginGate } from '../../store/loginGate.js';
import { fmtPrice, fmtCompact } from '../../lib/format.js';
import { usePrice } from '../../store/currency.js';
import Stars from '../Stars.jsx';

/**
 * Dense, touch-first marketplace product card (phones only).
 * Image-dominant, discount badge, compact title, prominent price,
 * rating + sold count. All business logic reused from shared stores.
 */
export default function MobileProductCard({ product }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const wished = useWishlist((s) => s.ids.has(String(product._id)));
  const toggleWish = useWishlist((s) => s.toggle);
  const openGate = useLoginGate((s) => s.open);
  const price = usePrice();
  const [popping, setPopping] = useState(false);

  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const isFlash = !!product.flashSaleActive;
  const flashPrice = product.flashSalePrice;
  const percent = product.flashSalePercent ? Math.round(Number(product.flashSalePercent)) : null;
  const outOfStock = product.stock === 0;

  const onWish = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return openGate();
    toggleWish(product._id)
      .then(() => {
        setPopping(true);
        setTimeout(() => setPopping(false), 420);
      })
      .catch(() => toast.error('Could not update wishlist'));
  };

  return (
    <Link
      to={`/product/${product._id}`}
      className="card press overflow-hidden flex flex-col"
      aria-label={product.name}
    >
      {/* Image */}
      <div className="relative w-full aspect-square overflow-hidden" style={{ background: 'var(--color-bg)' }}>
        {images[0] ? (
          <img
            src={images[0]}
            alt={product.name}
            width="400"
            height="400"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-3xl" style={{ color: 'var(--color-muted)' }}>📦</div>
        )}

        {/* Discount badge */}
        {isFlash && percent && (
          <span className="absolute top-1.5 left-1.5 text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
            style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
            -{percent}%
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={onWish}
          aria-label={t('nav.wishlist')}
          aria-pressed={wished}
          className="absolute top-1 right-1 w-9 h-9 grid place-items-center rounded-full bg-white/85 backdrop-blur-sm active:scale-90 transition"
        >
          <Heart size={16} className={wished ? 'fill-flash text-flash heart-pop' : 'text-gray-600'} />
        </button>

        {outOfStock && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <span className="text-white font-semibold text-xs uppercase tracking-wide">{t('product.outOfStock')}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-2 flex flex-col gap-0.5 flex-1">
        <div className="text-[13px] leading-snug line-clamp-2 min-h-[2.4em] font-localized">
          {product.name}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 flex-wrap mt-0.5">
          <span
            className="price-num text-[15px] font-bold leading-none"
            style={{ color: isFlash ? 'var(--color-flash)' : 'var(--color-brand)' }}
          >
            {price.fmt(isFlash ? flashPrice : product.price)}
          </span>
          {isFlash && Number(flashPrice) !== Number(product.price) && (
            <span className="price-num text-[11px] line-through" style={{ color: 'var(--color-muted)' }}>
              {price.fmt(product.price)}
            </span>
          )}
        </div>

        {/* Rating + sold */}
        <div className="flex items-center justify-between gap-1 text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
          <Stars value={product.ratingAvg} size={10} showNumber count={product.ratingCount || 0} />
          {product.soldCount > 0 && <span className="shrink-0">{fmtCompact(product.soldCount)}+ {t('product.sold')}</span>}
        </div>

        {product.freeShipping && (
          <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--color-success)' }}>
            {t('product.freeShipping')}
          </div>
        )}
      </div>
    </Link>
  );
}
