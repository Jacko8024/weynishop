import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../store/auth.js';
import { useWishlist } from '../store/wishlist.js';
import { useLoginGate } from '../store/loginGate.js';
import { fmtPrice, fmtCompact } from '../lib/format.js';
import Stars from './Stars.jsx';
import FlashCountdown from './FlashCountdown.jsx';

export default function ProductCard({ product, compact = false }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const wished = useWishlist((s) => s.ids.has(String(product._id)));
  const toggleWish = useWishlist((s) => s.toggle);
  const openGate = useLoginGate((s) => s.open);

  const [imgIdx, setImgIdx] = useState(0);
  const [popping, setPopping] = useState(false);

  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const hasSecond = images.length > 1;

  const isFlash = !!product.flashSaleActive;
  const flashPrice = product.flashSalePrice;
  const percent = product.flashSalePercent ? Math.round(Number(product.flashSalePercent)) : null;

  // Badges
  const badges = [];
  if (product.soldCount >= 1000) badges.push({ label: t('product.topSelling'), cls: 'bg-accent-500 text-black' });
  else if (product.soldCount < 50 && new Date(product.createdAt).getTime() > Date.now() - 14 * 86400_000)
    badges.push({ label: t('product.newArrival'), cls: 'bg-blue-500 text-white' });
  if (product.stock > 0 && product.stock <= 5)
    badges.push({ label: t('product.almostSoldOut'), cls: 'bg-orange-500 text-white' });

  const onWish = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return openGate();
    toggleWish(product._id).then(() => {
      setPopping(true);
      setTimeout(() => setPopping(false), 420);
    }).catch(() => toast.error('Could not update wishlist'));
  };

  return (
    <Link
      to={`/product/${product._id}`}
      className="group relative card overflow-hidden flex flex-col transition hover:-translate-y-1 hover:shadow-md"
      onMouseEnter={() => hasSecond && setImgIdx(1)}
      onMouseLeave={() => setImgIdx(0)}
    >
      {/* Image */}
      <div className="relative w-full aspect-square overflow-hidden" style={{ background: 'var(--color-bg)' }}>
        {images[imgIdx] ? (
          <img
            src={images[imgIdx]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-4xl" style={{ color: 'var(--color-muted)' }}>📦</div>
        )}

        {/* Flash sale ribbon */}
        {isFlash && (
          <span className="flash-ribbon">{t('product.flashSale')}</span>
        )}

        {/* Discount % */}
        {isFlash && percent && (
          <span className="absolute top-2 right-10 bg-flash text-white text-xs font-bold px-1.5 py-0.5 rounded">
            -{percent}%
          </span>
        )}

        {/* Wishlist heart */}
        <button
          onClick={onWish}
          aria-label="Save to wishlist"
          className={`absolute top-2 right-2 w-8 h-8 rounded-full grid place-items-center bg-white/90 hover:bg-white shadow ${popping ? 'heart-pop' : ''}`}
        >
          <Heart
            size={16}
            className={wished ? 'fill-flash text-flash' : 'text-gray-700'}
          />
        </button>

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <span className="text-white font-semibold text-sm uppercase tracking-wider">
              {t('product.outOfStock')}
            </span>
          </div>
        )}

        {/* Top-left status badges (stack below ribbon if present) */}
        <div className={`absolute ${isFlash ? 'top-9' : 'top-2'} left-2 flex flex-col gap-1`}>
          {badges.map((b, i) => (
            <span key={i} className={`badge ${b.cls} shadow-sm`}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-2.5 flex flex-col gap-1 flex-1">
        <div className="text-sm font-medium line-clamp-2 leading-snug min-h-[2.5em] font-localized">
          {product.name}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="price-num text-base font-bold" style={{ color: isFlash ? 'var(--color-flash)' : 'var(--color-brand)' }}>
            {fmtPrice(isFlash ? flashPrice : product.price)} ETB
          </span>
          {isFlash && (
            <span className="price-num text-xs line-through" style={{ color: 'var(--color-muted)' }}>
              {fmtPrice(product.price)}
            </span>
          )}
        </div>

        {/* Bulk price hint */}
        {!compact && product.bulkPriceTiers?.length > 0 && (
          <div className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
            {product.bulkPriceTiers[0].minQty}+ pcs:{' '}
            <span className="price-num font-medium" style={{ color: 'var(--color-text)' }}>
              {fmtPrice(product.bulkPriceTiers[0].price)} ETB
            </span>
          </div>
        )}

        {/* Rating + sold */}
        <div className="flex items-center justify-between text-[11px]" style={{ color: 'var(--color-muted)' }}>
          <Stars value={product.ratingAvg} size={11} showNumber count={product.ratingCount || 0} />
          {product.soldCount > 0 && (
            <span>{fmtCompact(product.soldCount)} {t('product.sold')}</span>
          )}
        </div>

        {/* Seller + free shipping row */}
        <div className="flex items-center justify-between text-[11px] mt-0.5">
          <span className="flex items-center gap-1 truncate" style={{ color: 'var(--color-muted)' }}>
            <span className="truncate max-w-[110px]">{product.seller?.shopName || product.seller?.name}</span>
            {product.seller?.verified && <span className="verified-tick">✓</span>}
          </span>
          {product.freeShipping && (
            <span className="inline-flex items-center gap-0.5 text-success font-medium" style={{ color: 'var(--color-success)' }}>
              <Truck size={11} /> {t('product.freeShipping')}
            </span>
          )}
        </div>

        {/* Flash countdown footer */}
        {isFlash && product.flashSaleEnd && (
          <div className="mt-1 flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-muted)' }}>
            <span>{t('flashSale.endsIn')}</span>
            <FlashCountdown endAt={product.flashSaleEnd} compact />
          </div>
        )}
      </div>
    </Link>
  );
}
