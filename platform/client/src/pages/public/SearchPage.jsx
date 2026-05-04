import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, X } from 'lucide-react';
import { api } from '../../api/client.js';
import { useCategories } from '../../lib/categories.js';
import ProductGrid from '../../components/ProductGrid.jsx';

const SORT_KEYS = ['best', 'priceLow', 'priceHigh', 'mostSold', 'newest', 'topRated'];

export default function SearchPage() {
  const { t } = useTranslation();
  const CATEGORIES = useCategories();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Local form state synced with URL
  const filters = useMemo(() => ({
    q: params.get('q') || '',
    category: params.get('category') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    minRating: params.get('minRating') || '',
    freeShipping: params.get('freeShipping') === '1',
    verifiedSeller: params.get('verifiedSeller') === '1',
    sort: params.get('sort') || 'best',
  }), [params]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v === false || v == null) next.delete(k);
      else if (v === true) next.set(k, '1');
      else next.set(k, String(v));
    });
    setParams(next, { replace: true });
  };

  const clearAll = () => setParams(new URLSearchParams(), { replace: true });

  useEffect(() => {
    let on = true;
    setLoading(true);
    (async () => {
      try {
        const { data } = await api.get('/products', { params: Object.fromEntries(params) });
        if (on) setItems(data.items || []);
      } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [params]);

  const chips = [];
  if (filters.q) chips.push({ key: 'q', label: `"${filters.q}"` });
  if (filters.category) chips.push({ key: 'category', label: CATEGORIES.find((c) => c.key === filters.category)?.label || filters.category });
  if (filters.minPrice || filters.maxPrice) chips.push({ key: 'price', label: `${filters.minPrice || 0}–${filters.maxPrice || '∞'} ETB` });
  if (filters.minRating) chips.push({ key: 'minRating', label: `${filters.minRating}★ ${t('filters.andUp')}` });
  if (filters.freeShipping) chips.push({ key: 'freeShipping', label: t('filters.freeShipping') });
  if (filters.verifiedSeller) chips.push({ key: 'verifiedSeller', label: t('filters.verifiedSeller') });

  const removeChip = (key) => {
    if (key === 'price') update({ minPrice: '', maxPrice: '' });
    else update({ [key]: '' });
  };

  const FilterPanel = () => (
    <div className="space-y-5 text-sm">
      {/* Category */}
      <div>
        <div className="font-semibold mb-2">{t('filters.category')}</div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="category" checked={!filters.category}
                   onChange={() => update({ category: '' })} />
            <span>{t('filters.all')}</span>
          </label>
          {CATEGORIES.map((c) => (
            <label key={c.key} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="category" checked={filters.category === c.key}
                     onChange={() => update({ category: c.key })} />
              <span>{c.icon} {c.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <div className="font-semibold mb-2">{t('filters.priceRange')}</div>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="0" className="input h-9 text-sm"
                 value={filters.minPrice}
                 onChange={(e) => update({ minPrice: e.target.value })} />
          <span style={{ color: 'var(--color-muted)' }}>–</span>
          <input type="number" placeholder="∞" className="input h-9 text-sm"
                 value={filters.maxPrice}
                 onChange={(e) => update({ maxPrice: e.target.value })} />
        </div>
      </div>

      {/* Rating */}
      <div>
        <div className="font-semibold mb-2">{t('filters.rating')}</div>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="minRating" checked={filters.minRating === String(r)}
                     onChange={() => update({ minRating: r })} />
              <span>{'★'.repeat(r)}{'☆'.repeat(5 - r)} {t('filters.andUp')}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="minRating" checked={!filters.minRating}
                   onChange={() => update({ minRating: '' })} />
            <span>{t('filters.all')}</span>
          </label>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filters.freeShipping}
                 onChange={(e) => update({ freeShipping: e.target.checked })} />
          <span>{t('filters.freeShipping')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filters.verifiedSeller}
                 onChange={(e) => update({ verifiedSeller: e.target.checked })} />
          <span>{t('filters.verifiedSeller')}</span>
        </label>
      </div>

      <button onClick={clearAll} className="btn-ghost w-full text-sm justify-center">
        {t('filters.clear')}
      </button>
    </div>
  );

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-4 md:py-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="text-sm">
          {filters.q && <span className="font-semibold">{filters.q} · </span>}
          <span style={{ color: 'var(--color-muted)' }}>{items.length} {t('product.reviews').replace('reviews','results') /* fallback */}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="input h-9 text-sm w-auto"
          >
            {SORT_KEYS.map((k) => <option key={k} value={k}>{t(`filters.sortOptions.${k}`)}</option>)}
          </select>
          <button onClick={() => setDrawerOpen(true)} className="btn-secondary md:hidden text-sm">
            <SlidersHorizontal size={16} /> {t('filters.title')}
          </button>
        </div>
      </div>

      {/* Chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {chips.map((c) => (
            <button key={c.key} onClick={() => removeChip(c.key)}
                    className="badge bg-brand-50 text-brand-700 inline-flex items-center gap-1 hover:bg-brand-100">
              {c.label} <X size={12} />
            </button>
          ))}
          <button onClick={clearAll} className="text-xs underline" style={{ color: 'var(--color-muted)' }}>
            {t('filters.clear')}
          </button>
        </div>
      )}

      <div className="flex gap-5">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="card p-4 sticky top-[76px]">
            <div className="font-bold mb-3 text-base">{t('filters.title')}</div>
            <FilterPanel />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <ProductGrid products={items} loading={loading} skeletonCount={12} />
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 animate-fadeIn"
             onClick={() => setDrawerOpen(false)}>
          <div className="absolute bottom-0 inset-x-0 rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}
               style={{ background: 'var(--color-surface)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-base">{t('filters.title')}</div>
              <button onClick={() => setDrawerOpen(false)} className="btn-ghost p-1.5"><X size={18} /></button>
            </div>
            <FilterPanel />
            <button onClick={() => setDrawerOpen(false)} className="btn-primary w-full mt-4">
              {t('filters.apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
