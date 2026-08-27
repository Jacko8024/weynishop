import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtPrice } from '../../lib/format.js';
import FlashCountdown from '../FlashCountdown.jsx';

/**
 * Marketplace-style Flash Deals rail.
 * Horizontal scroller of discounted products with countdown header.
 * Only rendered when real flash-sale products exist (no fake pricing).
 */
export default function MobileFlashDeals({ products = [], limit = 12 }) {
  const { t } = useTranslation();
  if (!products.length) return null;

  const flashEnd = products[0]?.flashSaleEnd;

  return (
    <section style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg grid place-items-center text-white"
                style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
            <Zap size={15} className="fill-white" />
          </span>
          <h2 className="font-bold text-base font-localized">{t('flashSale.title')}</h2>
          {flashEnd && (
            <span className="ml-1 text-[11px]" style={{ color: 'var(--color-muted)' }}>
              <FlashCountdown endAt={flashEnd} compact />
            </span>
          )}
        </div>
        <Link to="/deals" className="text-xs font-semibold" style={{ color: 'var(--color-brand)' }}>
          {t('flashSale.viewAll')} ›
        </Link>
      </div>

      <div className="mobile-rail no-scrollbar px-3 pb-3">
        {products.slice(0, limit).map((p) => {
          const percent = p.flashSalePercent ? Math.round(Number(p.flashSalePercent)) : null;
          const images = p.images?.length ? p.images : [p.image].filter(Boolean);
          return (
            <Link key={p._id} to={`/product/${p._id}`} className="w-[108px] press" aria-label={p.name}>
              <div className="relative w-[108px] h-[108px] rounded-xl overflow-hidden" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                {images[0] ? (
                  <img src={images[0]} alt={p.name} width="216" height="216"
                       className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-2xl">📦</div>
                )}
                {percent && (
                  <span className="absolute bottom-0 left-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-tr-lg"
                        style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
                    -{percent}%
                  </span>
                )}
              </div>
              <div className="mt-1 text-center">
                <div className="price-num text-sm font-bold leading-none" style={{ color: 'var(--color-flash)' }}>
                  ${fmtPrice(p.flashSalePrice ?? p.price)}
                </div>
                {percent ? (
                  <div className="price-num text-[10px] line-through" style={{ color: 'var(--color-muted)' }}>
                    ${fmtPrice(p.price)}
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
