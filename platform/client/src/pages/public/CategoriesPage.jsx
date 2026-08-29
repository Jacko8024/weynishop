import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCategories } from '../../lib/categories.js';
import useDocumentTitle from '../../lib/useDocumentTitle.js';

/**
 * Categories browse screen — grid of all admin-managed categories,
 * each linking into filtered search results.
 */
export default function CategoriesPage() {
  const { t } = useTranslation();
  const categories = useCategories();
  useDocumentTitle('Categories · Weynishop');

  return (
    <div className="px-3 py-3">
      <h1 className="font-bold text-lg font-localized px-1 pb-3">{t('nav.categories')}</h1>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.key}
              to={`/search?category=${c.key}`}
              className="card press flex flex-col items-center justify-center gap-2 py-4"
              aria-label={c.label}
            >
              <span className="w-12 h-12 grid place-items-center rounded-full"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                <Icon size={24} strokeWidth={1.75} />
              </span>
              <span className="text-xs font-medium text-center leading-tight line-clamp-2 px-1">{c.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
