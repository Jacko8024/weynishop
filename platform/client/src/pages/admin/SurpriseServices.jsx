import { useEffect, useRef, useState } from 'react';
import { Plus, Edit, Trash2, X, Upload, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

const GROUP_PRESETS = [
  { id: 'birthday', title: 'ለልደት እና እንዲሁ ሰርፕራይዝ ለማድረግ', subtitle: 'Birthday / surprise representation' },
  { id: 'event', title: 'ለሀዘን, ለደስታ (ድግስ) ወይንም የታመመ ለመጠየቅ', subtitle: 'Funeral / feast / health visit' },
  { id: 'gift', title: 'ስጦታ ማድረስ (Gift Delivery)', subtitle: 'Gift delivery' },
  { id: 'proposal', title: 'Proposal & Anniversary', subtitle: 'Proposal / anniversary surprises' },
];

const empty = {
  groupId: 'birthday',
  groupTitle: GROUP_PRESETS[0].title,
  groupSubtitle: '',
  name: '',
  image: '',
  rating: 5.0,
  price: 50,
  featuresText: '',
  displayOrder: 0,
  isActive: true,
};

export default function SurpriseServices() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () =>
    api.get('/surprise/admin/services').then(({ data }) => setItems(data.items || []));

  useEffect(() => { load().catch(() => toast.error('Failed to load services')); }, []);

  const toForm = (s) => ({
    groupId: s.groupId,
    groupTitle: s.groupTitle,
    groupSubtitle: s.groupSubtitle,
    name: s.name,
    image: s.image,
    rating: Number(s.rating),
    price: Number(s.price),
    featuresText: (s.features || []).join('\n'),
    displayOrder: s.displayOrder,
    isActive: s.isActive,
  });

  const save = async (e) => {
    e.preventDefault();
    if (!editing.image) return toast.error('Please upload a service image');
    try {
      const payload = {
        groupId: editing.groupId === '___new___' ? editing.customGroupId : editing.groupId,
        groupTitle: editing.groupTitle,
        groupSubtitle: editing.groupSubtitle,
        name: editing.name,
        image: editing.image,
        rating: Number(editing.rating) || 5,
        price: Number(editing.price) || 0,
        features: (editing.featuresText || '').split('\n').map((f) => f.trim()).filter(Boolean),
        displayOrder: Number(editing.displayOrder) || 0,
        isActive: editing.isActive,
      };
      if (editing.id) {
        await api.put(`/surprise/admin/services/${editing.id}`, payload);
      } else {
        await api.post('/surprise/admin/services', payload);
      }
      toast.success('Saved — visible on /surprise');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    await api.delete(`/surprise/admin/services/${s.id}`);
    toast.success('Deleted');
    load();
  };

  const toggleActive = async (s) => {
    try {
      await api.put(`/surprise/admin/services/${s.id}`, { isActive: !s.isActive });
      load();
    } catch { toast.error('Failed'); }
  };

  const onPickGroup = (gid) => {
    const preset = GROUP_PRESETS.find((g) => g.id === gid);
    setEditing((cur) => ({
      ...cur,
      groupId: gid,
      ...(preset ? { groupTitle: preset.title } : {}),
    }));
  };

  const onPickFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/uploads/surprise/admin', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditing((cur) => ({ ...cur, image: data.url }));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const groups = [...new Set(items.map((s) => s.groupId))];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Surprise services</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Only the admin can publish here — regular users cannot post. Changes appear instantly on /surprise.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({ ...empty, groupTitle: GROUP_PRESETS[0].title })}>
          <Plus size={16} /> New service
        </button>
      </div>

      <div className="space-y-3">
        {items.map((s) => (
          <div key={s.id} className="card p-3 flex items-center gap-3">
            {s.image && <img src={s.image} alt={s.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold truncate">{s.name}</span>
                {!s.isActive && <span className="badge bg-slate-700 text-white">Inactive</span>}
                <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>{s.groupId}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                ⭐ {Number(s.rating)} · ${Number(s.price)} · order {s.displayOrder} · #{s.id}
                {s.provider?.name && <span className="ml-2">by {s.provider.shopName || s.provider.name}</span>}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing(toForm(s))} className="btn-secondary text-xs">
                <Edit size={14} /> Edit
              </button>
              <button onClick={() => toggleActive(s)} className="btn-ghost text-xs" title={s.isActive ? 'Deactivate' : 'Activate'}>
                {s.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button onClick={() => remove(s)} className="btn-danger text-xs">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="text-center py-10" style={{ color: 'var(--color-muted)' }}>
            No services yet. Create your first one above.
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4 overflow-y-auto"
             onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()}
                className="card p-6 w-full max-w-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">{editing.id ? 'Edit service' : 'New service'}</h2>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost"><X size={18} /></button>
            </div>

            <div>
              <label className="label">Service image</label>
              <div className="aspect-[3/2] rounded-xl overflow-hidden border relative bg-slate-50"
                   style={{ borderColor: 'var(--color-border)' }}>
                {editing.image ? (
                  <img src={editing.image} alt={editing.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-sm text-slate-400">No image yet</div>
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
                <Upload size={14} /> {editing.image ? 'Replace image' : 'Upload image'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Group</label>
                <select className="input" value={editing.groupId} onChange={(e) => onPickGroup(e.target.value)}>
                  {GROUP_PRESETS.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                  {groups.filter((g) => !GROUP_PRESETS.some((p) => p.id === g)).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  <option value="___new___">+ Add New Custom Section...</option>
                </select>
                {editing.groupId === '___new___' && (
                  <div className="mt-2 text-sm">
                    <label className="label text-xs text-brand-600">Enter custom ID (e.g. holiday)</label>
                    <input className="input" placeholder="custom_id" 
                           onChange={(e) => setEditing({ ...editing, customGroupId: e.target.value })} />
                  </div>
                )}
              </div>
              <div>
                <label className="label">Service name</label>
                <input className="input" required value={editing.name || ''}
                       onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">Group title (shown on /surprise)</label>
              <input className="input" value={editing.groupTitle || ''}
                     onChange={(e) => setEditing({ ...editing, groupTitle: e.target.value })} />
            </div>
            <div>
              <label className="label">Group subtitle</label>
              <textarea rows={2} className="input" value={editing.groupSubtitle || ''}
                        onChange={(e) => setEditing({ ...editing, groupSubtitle: e.target.value })} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Rating</label>
                <input className="input" type="number" step="0.1" min="0" max="5"
                       value={editing.rating} onChange={(e) => setEditing({ ...editing, rating: e.target.value })} />
              </div>
              <div>
                <label className="label">Price ($)</label>
                <input className="input" type="number" min="0"
                       value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
              </div>
              <div>
                <label className="label">Display order</label>
                <input className="input" type="number" min="0"
                       value={editing.displayOrder} onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">Features (one per line)</label>
              <textarea rows={3} className="input" placeholder="ኬክ እና ሪችት&#10;🚚 ከድላይቨሪ ውጪ"
                        value={editing.featuresText || ''}
                        onChange={(e) => setEditing({ ...editing, featuresText: e.target.value })} />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!editing.isActive}
                     onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              <span>Active (visible on /surprise)</span>
            </label>

            <button className="btn-primary w-full" disabled={uploading}>
              <Check size={14} /> Save
            </button>
          </form>
        </div>
      )}
    </div>
  );
}