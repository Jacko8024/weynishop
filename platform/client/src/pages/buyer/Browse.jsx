import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../../api/client.js';
import { formatMoney } from '../../lib/helpers.js';

export default function Browse() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [filters, setFilters] = useState({ q: '', category: '', maxPrice: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.category) params.category = filters.category;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    const { data } = await api.get('/products', { params });
    setItems(data.items);
    setLoading(false);
  };

  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCats(data.categories));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1">
          <label className="label">Search</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search products…"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Category</label>
          <select
            className="input"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All</option>
            {cats.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Max price</label>
          <input
            className="input w-32"
            type="number"
            placeholder="Any"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center text-slate-500 py-10">No products found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((p) => (
            <Link key={p._id} to={`/buyer/product/${p._id}`} className="card overflow-hidden hover:shadow-md transition">
              <div className="aspect-square bg-slate-100 overflow-hidden">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-slate-400">No image</div>
                )}
              </div>
              <div className="p-3">
                <div className="font-medium line-clamp-1">{p.name}</div>
                <div className="text-xs text-slate-500">{p.seller?.shopName || p.seller?.name}</div>
                <div className="mt-1 font-semibold text-brand-600">{formatMoney(p.price)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
