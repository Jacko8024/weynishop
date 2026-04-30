import { useEffect, useRef, useState } from 'react';
import { Plus, Edit, Trash2, X, Upload, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

const empty = { title: '', subtitle: '', imageUrl: '', linkUrl: '', displayOrder: 0, isActive: true };

export default function AdminBanners() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () =>
    api.get('/banners/admin').then(({ data }) => setItems(data.items || []));

  useEffect(() => { load().catch(() => toast.error('Failed to load banners')); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!editing.imageUrl) return toast.error('Please upload a banner image');
    try {
      const payload = {
        ...editing,
        displayOrder: Number(editing.displayOrder) || 0,
      };
      if (editing._id || editing.id) {
        await api.put(`/banners/admin/${editing._id || editing.id}`, payload);
      } else {
        await api.post('/banners/admin', payload);
      }
      toast.success('Saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this banner?')) return;
    await api.delete(`/banners/admin/${id}`);
    toast.success('Deleted');
    load();
  };

  const toggleActive = async (b) => {
    try {
      await api.put(`/banners/admin/${b._id || b.id}`, { isActive: !b.isActive });
      load();
    } catch { toast.error('Failed'); }
  };

  const onPickFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/uploads/banners', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditing((cur) => ({ ...cur, imageUrl: data.url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Banner ads</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Upload, reorder and toggle the carousel banners shown on the storefront.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({ ...empty })}>
          <Plus size={16} /> New banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((b) => (
          <div key={b._id || b.id} className="card overflow-hidden">
            <div className="aspect-[8/3] bg-slate-100 relative">
              {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />}
              {!b.isActive && (
                <span className="absolute top-2 left-2 badge bg-slate-700 text-white">Inactive</span>
              )}
              <span className="absolute top-2 right-2 badge bg-white/90 text-black">#{b.displayOrder}</span>
            </div>
            <div className="p-3">
              <div className="font-semibold truncate">{b.title || <em className="text-slate-400">No title</em>}</div>
              {b.subtitle && <div className="text-sm text-slate-500 truncate">{b.subtitle}</div>}
              {b.linkUrl && (
                <div className="text-xs mt-1 truncate" style={{ color: 'var(--color-muted)' }}>
                  → {b.linkUrl}
                </div>
              )}
              <div className="flex gap-1 mt-2">
                <button onClick={() => setEditing({ ...b })} className="btn-secondary text-xs flex-1">
                  <Edit size={14} /> Edit
                </button>
                <button onClick={() => toggleActive(b)} className="btn-ghost text-xs" title={b.isActive ? 'Deactivate' : 'Activate'}>
                  {b.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => remove(b._id || b.id)} className="btn-danger text-xs">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="col-span-full text-center py-10" style={{ color: 'var(--color-muted)' }}>
            No banners yet. Create your first one above.
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4 overflow-y-auto"
             onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()}
                className="card p-6 w-full max-w-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{editing._id || editing.id ? 'Edit banner' : 'New banner'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost"><X size={18} /></button>
            </div>

            <div>
              <label className="label">Banner image</label>
              <div className="aspect-[8/3] rounded-xl overflow-hidden border relative bg-slate-50"
                   style={{ borderColor: 'var(--color-border)' }}>
                {editing.imageUrl ? (
                  <img src={editing.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-sm text-slate-400">
                    No image yet
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 grid place-items-center bg-black/40 text-white">
                    <Loader2 className="animate-spin" />
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                     onChange={(e) => { onPickFile(e.target.files?.[0]); e.target.value = ''; }} />
              <button type="button" onClick={() => fileRef.current?.click()}
                      className="btn-secondary mt-2 text-sm w-full">
                <Upload size={14} /> {editing.imageUrl ? 'Replace image' : 'Upload image'}
              </button>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Auto-cropped to 1600×600 (cover-fit).
              </p>
            </div>

            <div><label className="label">Title</label>
              <input className="input" value={editing.title || ''}
                     onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            </div>
            <div><label className="label">Subtitle</label>
              <input className="input" value={editing.subtitle || ''}
                     onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
            </div>
            <div><label className="label">Link URL</label>
              <input className="input" placeholder="/search or https://..."
                     value={editing.linkUrl || ''}
                     onChange={(e) => setEditing({ ...editing, linkUrl: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Display order</label>
                <input className="input" type="number"
                       value={editing.displayOrder ?? 0}
                       onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })} />
              </div>
              <label className="flex items-end gap-2 text-sm cursor-pointer pb-2">
                <input type="checkbox" checked={!!editing.isActive}
                       onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
                <span>Active (visible on storefront)</span>
              </label>
            </div>

            <button className="btn-primary w-full" disabled={uploading}>
              <Check size={14} /> Save
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
