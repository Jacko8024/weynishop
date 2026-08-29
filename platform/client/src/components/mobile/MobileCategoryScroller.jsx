import { Link } from 'react-router-dom';
import { useCategories } from '../../lib/categories.js';

/**
 * Horizontal scrolling category carousel (compact circular tiles).
 * Uses real admin-managed categories via the shared cached hook.
 */
export default function MobileCategoryScroller() {
  const categories = useCategories();

  return (
    <div className="mobile-rail no-scrollbar px-3 py-2">
      {categories.map((c) => (
        <Link
          key={c.key}
          to={`/search?category=${c.key}`}
          className="flex flex-col items-center gap-1.5 w-[64px] press"
          aria-label={c.label}
        >
          <span
            className="w-14 h-14 grid place-items-center rounded-full"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <c.icon size={24} strokeWidth={1.75} />
          </span>
          <span className="text-[11px] leading-tight text-center line-clamp-1 w-full" style={{ color: 'var(--color-text)' }}>
            {c.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
