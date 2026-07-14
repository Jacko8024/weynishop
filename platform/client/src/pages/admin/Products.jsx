import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, X, Search, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { useCategories } from '../../lib/categories.js';
import { formatMoney } from '../../lib/helpers.js';

const empty = {
  name: '', description: '', price: '', stock: 0, category: 'general', sellerId: '',
  images: [], isActive: true, freeShipping: false,
  flashSaleStart: '', flashSaleEnd: '', flashSalePercent: '',
  bulkPriceTiers: [],
};

const toLocalInput = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

export default function AdminProducts() {
  const CATEGORIES = useCategories();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sellers, setSellers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterCat, setFilterCat] = useState('');

  const load = (p = page, q = search, cat = filterCat) =>
    api.get('/admin/products', { params: { page: p, limit: 50, q, category: cat || undefined } })
      .then(({ data }) => { setItems(data.items); setTotal(data.total); });
  useEffect(() => { load(); }, []);

  useEffect(() => {
    api.get('/admin/users', { params: { role: 'seller' } })
      .then(({ data }) => setSellers(data.users || []))
      .catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!editing.name) return toast.error('Name required');
    const payload = {
      ...editing,
      price: Number(editing.price),
      stock: Number(editing.stock),
      images: editing.images.filter(Boolean),
      flashSaleStart: editing.flashSaleStart ? new Date(editing.flashSaleStart).toISOString() : null,
      flashSaleEnd: editing.flashSaleEnd ? new Date(editing.flashSaleEnd).toISOString() : null,
      flashSalePercent: editing.flashSalePercent === '' ? null : Number(editing.flashSalePercent),
      bulkPriceTiers: editing.bulkPriceTiers
        .map((t) => ({ minQty: Number(t.minQty), price: Number(t.price) }))
        .filter((t) => t.minQty > 0 && t.price > 0),
    };
    try {
      if (editing._id) await api.put(`/admin/products/${editing._id}`, payload);
      else await api.post('/admin/products', payload);
      toast.success('Saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/admin/products/${id}`);
    toast.success('Deleted');
    load();
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      const { data } = await api.post('/uploads/products', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const urls = data.urls || [];
      setEditing((cur) => ({ ...cur, images: [...(cur.images || []), ...urls] }));
      toast.success(`${urls.length} image${urls.length === 1 ? '' : 's'} uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImg = (i) =>
    setEditing((cur) => ({ ...cur, images: cur.images.filter((_, idx) => idx !== i) }));

  const setTier = (i, key, v) => {
    const tiers = [...editing.bulkPriceTiers];
    tiers[i] = { ...tiers[i], [key]: v };
    setEditing({ ...editing, bulkPriceTiers: tiers });
  };
  const addTier = () => setEditing({ ...editing, bulkPriceTiers: [...editing.bulkPriceTiers, { minQty: '', price: '' }] });
  const removeTier = (i) => setEditing({ ...editing, bulkPriceTiers: editing.bulkPriceTiers.filter((_, idx) => idx !== i) });

  const sellerMap = useMemo(() => {
    const m = {};
    sellers.forEach((s) => { m[s.id || s._id] = s; });
    return m;
  }, [sellers]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Products</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {total} product{total === 1 ? '' : 's'} total
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({ ...empty })}>
          <Plus size={16} /> Add product
        </button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
          <input className="input pl-9" placeholder="Search products…"
                 value={search} onChange={(e) => setSearch(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load(1, search, filterCat); } }} />
        </div>
        <select className="input w-auto" value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setPage(1); load(1, search, e.target.value); }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 w-12">Img</th>
              <th className="p-3">Name</th>
              <th className="p-3">Seller</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Stock</th>
              <th className="p-3 text-right">Sold</th>
              <th className="p-3 w-20">Status</th>
              <th className="p-3 w-36 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id || p.id} className="border-t">
                <td className="p-2">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded" style={{ background: 'var(--color-bg)' }} />
                  )}
                </td>
                <td className="p-3 font-medium max-w-[200px] truncate">{p.name}</td>
                <td className="p-3 text-xs">{p.seller?.shopName || p.seller?.name || '—'}</td>
                <td className="p-3 capitalize">{p.category}</td>
                <td className="p-3 text-right font-medium">{formatMoney(p.price)}</td>
                <td className="p-3 text-right">{p.stock}</td>
                <td className="p-3 text-right">{p.soldCount || 0}</td>
                <td className="p-3">
                  {p.isActive
                    ? <span className="badge bg-green-100 text-green-700">Active</span>
                    : <span className="badge bg-slate-200 text-slate-600">Inactive</span>}
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing({
                    ...p,
                    price: p.basePrice != null ? String(p.basePrice) : (p.price ?? ''),
                    images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
                    flashSaleStart: toLocalInput(p.flashSaleStart),
                    flashSaleEnd: toLocalInput(p.flashSaleEnd),
                    flashSalePercent: p.flashSalePercent ?? '',
                    bulkPriceTiers: Array.isArray(p.bulkPriceTiers) ? p.bulkPriceTiers : [],
                    sellerId: p.sellerId || '',
                  })} className="btn-secondary text-xs ml-1">
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => remove(p._id || p.id)} className="btn-danger text-xs ml-1">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={9} className="p-6 text-center text-slate-500">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {total > 50 && (
        <div className="flex justify-center gap-2">
          <button className="btn-secondary text-sm" disabled={page <= 1}
                  onClick={() => { const np = page - 1; setPage(np); load(np, search, filterCat); }}>
            Prev
          </button>
          <span className="text-sm self-center px-3" style={{ color: 'var(--color-muted)' }}>
            Page {page} of {Math.ceil(total / 50)}
          </span>
          <button className="btn-secondary text-sm" disabled={page >= Math.ceil(total / 50)}
                  onClick={() => { const np = page + 1; setPage(np); load(np, search, filterCat); }}>
            Next
          </button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()}
                className="card p-6 w-full max-w-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{editing._id ? 'Edit product' : 'New product'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost"><X size={18} /></button>
            </div>

            <div><label className="label">Name</label><input className="input" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><label className="label">Description</label><textarea className="input" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Price (USD)</label><input className="input" type="number" min="0" step="0.01" required value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></div>
              <div><label className="label">Stock</label><input className="input" type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Category</label>
                <select className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              {!editing._id && (
                <div>
                  <label className="label">Seller</label>
                  <select className="input" required value={editing.sellerId} onChange={(e) => setEditing({ ...editing, sellerId: e.target.value })}>
                    <option value="">Select seller…</option>
                    {sellers.filter((s) => s.status === 'active').map((s) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.shopName || s.name} ({s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editing.freeShipping} onChange={(e) => setEditing({ ...editing, freeShipping: e.target.checked })} />
              <span>Free shipping</span>
            </label>

            <div>
              <label className="label">Images</label>
              <label htmlFor="admin-product-image-input"
                     className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer hover:bg-[var(--color-bg)] transition"
                     style={{ borderColor: 'var(--color-border)' }}
                     onDragOver={(e) => { e.preventDefault(); }}
                     onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
                {uploading ? (
                  <><Loader2 size={22} className="animate-spin" /><span className="text-sm">Uploading…</span></>
                ) : (
                  <>
                    <Upload size={22} style={{ color: 'var(--color-muted)' }} />
                    <span className="text-sm font-medium">Click or drag images</span>
                  </>
                )}
              </label>
              <input id="admin-product-image-input" type="file" accept="image/*" multiple className="hidden"
                     onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
              {editing.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {editing.images.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                      <img src={src} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImg(i)}
                              className="absolute top-1 right-1 w-6 h-6 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80">
                        <X size={12} />
                      </button>
                      {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/90 text-black">Main</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Flash sale */}
            <div className="rounded-xl p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div className="font-semibold mb-2">Flash sale (optional)</div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs">Start</label><input className="input" type="datetime-local" value={editing.flashSaleStart} onChange={(e) => setEditing({ ...editing, flashSaleStart: e.target.value })} /></div>
                <div><label className="text-xs">End</label><input className="input" type="datetime-local" value={editing.flashSaleEnd} onChange={(e) => setEditing({ ...editing, flashSaleEnd: e.target.value })} /></div>
                <div><label className="text-xs">Discount %</label><input className="input" type="number" min="1" max="90" placeholder="e.g. 20" value={editing.flashSalePercent} onChange={(e) => setEditing({ ...editing, flashSalePercent: e.target.value })} /></div>
              </div>
            </div>

            {/* Bulk pricing */}
            <div className="rounded-xl p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Bulk pricing tiers (optional)</div>
                <button type="button" onClick={addTier} className="text-xs underline" style={{ color: 'var(--color-brand)' }}>+ Add tier</button>
              </div>
              {editing.bulkPriceTiers.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>e.g. 10+ pcs at a discount.</p>
              )}
              {editing.bulkPriceTiers.map((tier, i) => (
                <div key={i} className="flex gap-2 items-end mb-2">
                  <div className="flex-1"><label className="text-xs">Min qty</label><input className="input" type="number" min="2" value={tier.minQty || ''} onChange={(e) => setTier(i, 'minQty', e.target.value)} /></div>
                  <div className="flex-1"><label className="text-xs">Price (USD)</label><input className="input" type="number" min="0" value={tier.price || ''} onChange={(e) => setTier(i, 'price', e.target.value)} /></div>
                  <button type="button" onClick={() => removeTier(i)} className="btn-ghost p-2 mb-0.5"><X size={14} /></button>
                </div>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editing.isActive !== false}
                     onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              <span>Active (visible to buyers)</span>
            </label>

            <button className="btn-primary w-full" disabled={uploading}>Save</button>
          </form>
        </div>
      )}
    </div>
  );
}
