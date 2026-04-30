import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, X, Zap, Upload, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { formatMoney } from '../../lib/helpers.js';
import { useCategories } from '../../lib/categories.js';
import { useCommissionPercent } from '../../lib/commission.js';

const empty = {
  name: '', description: '', price: '', stock: 0, category: 'general',
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

export default function SellerProducts() {
  const CATEGORIES = useCategories();
  const commissionPercent = useCommissionPercent();

  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = () => api.get('/products/mine').then(({ data }) => setItems(data.items));
  useEffect(() => { load(); }, []);

  // When opening the form, prefer the seller's stored basePrice (their own input)
  // — that's what they care about. The buyer-facing final price is computed live.
  const startEdit = (p) => setEditing({
    ...empty,
    ...p,
    price: p.basePrice != null ? String(p.basePrice) : (p.price ?? ''),
    images: Array.isArray(p.images) ? p.images.filter(Boolean) : [],
    flashSaleStart: toLocalInput(p.flashSaleStart),
    flashSaleEnd: toLocalInput(p.flashSaleEnd),
    flashSalePercent: p.flashSalePercent ?? '',
    bulkPriceTiers: Array.isArray(p.bulkPriceTiers) ? p.bulkPriceTiers : [],
  });

  // ---- live commission preview --------------------------------------------
  const basePriceNum = Number(editing?.price) || 0;
  const commissionAmount = useMemo(
    () => Math.round(basePriceNum * (commissionPercent / 100) * 100) / 100,
    [basePriceNum, commissionPercent]
  );
  const finalPrice = useMemo(
    () => Math.round((basePriceNum + commissionAmount) * 100) / 100,
    [basePriceNum, commissionAmount]
  );

  const save = async (e) => {
    e.preventDefault();
    if (!editing.images.length) {
      toast.error('Please upload at least one product image');
      return;
    }
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
      if (editing._id) await api.put(`/products/${editing._id}`, payload);
      else await api.post('/products', payload);
      toast.success('Saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete product?')) return;
    await api.delete(`/products/${id}`);
    toast.success('Deleted');
    load();
  };

  // ---- image upload --------------------------------------------------------
  // Server normalises every uploaded image to the standard product size with a
  // cover-crop (no stretching), so the seller doesn't pre-process anything.
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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Products</h1>
        <button className="btn-primary" onClick={() => setEditing({ ...empty })}><Plus size={16} /> Add product</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((p) => (
          <div key={p._id} className="card overflow-hidden">
            <div className="aspect-square relative" style={{ background: 'var(--color-bg)' }}>
              {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
              {p.flashSaleActive && <span className="flash-ribbon">Flash {Math.round(Number(p.flashSalePercent))}%</span>}
            </div>
            <div className="p-3">
              <div className="font-medium line-clamp-1">{p.name}</div>
              <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {p.category} · stock {p.stock} · sold {p.soldCount || 0}
              </div>
              <div className="mt-1 space-y-0.5">
                <div className="font-semibold price-num" style={{ color: 'var(--color-brand)' }}>
                  {formatMoney(p.basePrice ?? p.price)}{' '}
                  <span className="text-[10px] font-normal" style={{ color: 'var(--color-muted)' }}>your price</span>
                </div>
                {Number(p.price) !== Number(p.basePrice ?? p.price) && (
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    Buyers see: <span className="price-num font-medium" style={{ color: 'var(--color-text)' }}>{formatMoney(p.price)}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1 mt-2">
                <button onClick={() => startEdit(p)} className="btn-secondary text-xs flex-1"><Edit size={14} /> Edit</button>
                <button onClick={() => remove(p._id)} className="btn-danger text-xs"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <div className="col-span-full text-center py-10" style={{ color: 'var(--color-muted)' }}>No products. Add your first one!</div>}
      </div>

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

            {/* Pricing block: base price input + read-only commission % +
                live commission amount + final buyer price */}
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Product price (ETB)</label>
                  <input className="input" type="number" min="0" step="0.01" required
                         value={editing.price}
                         onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
                </div>
                <div>
                  <label className="label">Commission %</label>
                  <input className="input" type="number" readOnly tabIndex={-1}
                         value={commissionPercent}
                         title="Set by the platform admin"
                         style={{ background: 'var(--color-surface)', cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="text-sm flex flex-wrap gap-x-4 gap-y-1 pt-1">
                <span style={{ color: 'var(--color-muted)' }}>
                  Commission:{' '}
                  <span className="price-num font-semibold" style={{ color: 'var(--color-text)' }}>
                    {commissionAmount.toFixed(2)} ETB
                  </span>
                </span>
                <span style={{ color: 'var(--color-muted)' }}>
                  Final price (shown to buyers):{' '}
                  <span className="price-num font-bold" style={{ color: 'var(--color-brand)' }}>
                    {finalPrice.toFixed(2)} ETB
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Stock</label><input className="input" type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} /></div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editing.freeShipping} onChange={(e) => setEditing({ ...editing, freeShipping: e.target.checked })} />
              <span>Offer free shipping</span>
            </label>

            {/* Image upload — replaces the old "paste link" inputs.
                Server crops every upload to the standard product size. */}
            <div>
              <label className="label">Product images</label>
              <label
                htmlFor="product-image-input"
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer hover:bg-[var(--color-bg)] transition"
                style={{ borderColor: 'var(--color-border)' }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              >
                {uploading ? (
                  <><Loader2 size={22} className="animate-spin" /><span className="text-sm">Uploading…</span></>
                ) : (
                  <>
                    <Upload size={22} style={{ color: 'var(--color-muted)' }} />
                    <span className="text-sm font-medium">Click or drag images here</span>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      JPEG / PNG / WEBP — multiple images supported · auto-cropped to 800×800
                    </span>
                  </>
                )}
              </label>
              <input
                id="product-image-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
              />
              {editing.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {editing.images.map((src, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImg(i)}
                              className="absolute top-1 right-1 w-6 h-6 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                              aria-label="Remove image">
                        <X size={12} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/90 text-black">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                First image is the main photo. Drag-drop or click to add more.
              </p>
            </div>

            <div className="rounded-xl p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div className="font-semibold mb-2 inline-flex items-center gap-1.5">
                <Zap size={14} className="text-flash" /> Flash sale (optional)
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="text-xs">Start</label><input className="input" type="datetime-local" value={editing.flashSaleStart} onChange={(e) => setEditing({ ...editing, flashSaleStart: e.target.value })} /></div>
                <div><label className="text-xs">End</label><input className="input" type="datetime-local" value={editing.flashSaleEnd} onChange={(e) => setEditing({ ...editing, flashSaleEnd: e.target.value })} /></div>
                <div><label className="text-xs">Discount %</label><input className="input" type="number" min="1" max="90" placeholder="e.g. 20" value={editing.flashSalePercent} onChange={(e) => setEditing({ ...editing, flashSalePercent: e.target.value })} /></div>
              </div>
              <p className="text-[11px] mt-2" style={{ color: 'var(--color-muted)' }}>Leave dates empty to disable.</p>
            </div>

            <div className="rounded-xl p-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Bulk pricing tiers (optional)</div>
                <button type="button" onClick={addTier} className="text-xs underline" style={{ color: 'var(--color-brand)' }}>+ Add tier</button>
              </div>
              <div className="space-y-2">
                {editing.bulkPriceTiers.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--color-muted)' }}>e.g. 10+ pcs at a discount.</p>
                )}
                {editing.bulkPriceTiers.map((tier, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1"><label className="text-xs">Min qty</label><input className="input" type="number" min="2" value={tier.minQty || ''} onChange={(e) => setTier(i, 'minQty', e.target.value)} /></div>
                    <div className="flex-1"><label className="text-xs">Price (ETB)</label><input className="input" type="number" min="0" value={tier.price || ''} onChange={(e) => setTier(i, 'price', e.target.value)} /></div>
                    <button type="button" onClick={() => removeTier(i)} className="btn-ghost p-2 mb-0.5"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary w-full" disabled={uploading}>Save</button>
          </form>
        </div>
      )}
    </div>
  );
}
