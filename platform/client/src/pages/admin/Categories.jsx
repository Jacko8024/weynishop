import { useEffect, useRef, useState } from 'react';
import { Plus, Edit, Trash2, X, Check, Eye, EyeOff, Smile } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { refreshCategories } from '../../lib/categories.js';

// Curated emoji palette for the admin emoji picker. Kept intentionally short
// so it loads instantly with no network round-trip; the admin can also paste
// any other emoji into the input directly.
const EMOJI_PALETTE = [
  '🛒','👗','👠','📱','💻','🏠','🛋️','💄','💅','⚽','🏀','🧸','🎮',
  '🍎','🥦','🍞','🥩','🥛','🍕','☕','🍫','🌶️','🧂','🍯','🍷',
  '🎁','🛍️','💎','⌚','🎒','📚','✏️','🖊️','🎨','🪴','🌸','🐶','🐱',
  '🚗','🚲','🧴','🧼','💊','🩺','🎧','📷','🔌','🧰','🔨','🧵','🧺',
  '👶','👕','👖','🧥','🧦','👟','👞','🕶️','💍','👜','🎒','🪞',
];

const empty = { key: '', label: '', emoji: '🎁', displayOrder: 0, isActive: true };

const EmojiPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen((o) => !o)}
                className="input flex items-center justify-center text-2xl w-16"
                title="Pick an emoji" aria-label="Pick emoji">
          {value || '🎁'}
        </button>
        <input className="input flex-1" maxLength={6}
               placeholder="or paste emoji"
               value={value || ''}
               onChange={(e) => onChange(e.target.value)} />
      </div>
      {open && (
        <div className="absolute z-50 mt-2 left-0 right-0 max-w-md p-2 rounded-xl shadow-lg border grid grid-cols-10 gap-1"
             style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          {EMOJI_PALETTE.map((em) => (
            <button key={em} type="button"
                    onClick={() => { onChange(em); setOpen(false); }}
                    className={`text-2xl p-1 rounded hover:bg-[var(--color-bg)] ${value === em ? 'bg-[var(--color-bg)] ring-2 ring-brand-400' : ''}`}>
              {em}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () =>
    api.get('/categories/admin').then(({ data }) => setItems(data.items || []));
  useEffect(() => { load().catch(() => toast.error('Failed to load categories')); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!editing.label) return toast.error('Label required');
    if (!editing.emoji) return toast.error('Emoji required');
    try {
      const payload = { ...editing, displayOrder: Number(editing.displayOrder) || 0 };
      if (editing._id || editing.id) {
        await api.put(`/categories/admin/${editing._id || editing.id}`, payload);
      } else {
        await api.post('/categories/admin', payload);
      }
      toast.success('Saved');
      setEditing(null);
      await load();
      refreshCategories(); // bust storefront cache
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/admin/${id}`);
    toast.success('Deleted');
    await load();
    refreshCategories();
  };

  const toggleActive = async (c) => {
    try {
      await api.put(`/categories/admin/${c._id || c.id}`, { isActive: !c.isActive });
      await load();
      refreshCategories();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Categories</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Manage the storefront categories and their emoji icons.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({ ...empty })}>
          <Plus size={16} /> Add category
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 w-16">Emoji</th>
              <th className="p-3">Label</th>
              <th className="p-3">Key</th>
              <th className="p-3 w-20">Order</th>
              <th className="p-3 w-24">Status</th>
              <th className="p-3 w-40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c._id || c.id} className="border-t">
                <td className="p-3 text-3xl">{c.emoji || '🎁'}</td>
                <td className="p-3 font-medium">{c.label}</td>
                <td className="p-3 text-slate-500">{c.key}</td>
                <td className="p-3">{c.displayOrder}</td>
                <td className="p-3">
                  {c.isActive
                    ? <span className="badge bg-green-100 text-green-700">Active</span>
                    : <span className="badge bg-slate-200 text-slate-600">Inactive</span>}
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => toggleActive(c)} className="btn-ghost text-xs" title={c.isActive ? 'Deactivate' : 'Activate'}>
                    {c.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => setEditing({ ...c })} className="btn-secondary text-xs ml-1">
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => remove(c._id || c.id)} className="btn-danger text-xs ml-1">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">No categories yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4"
             onClick={() => setEditing(null)}>
          <form onSubmit={save} onClick={(e) => e.stopPropagation()}
                className="card p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editing._id || editing.id ? 'Edit category' : 'New category'}
              </h2>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost"><X size={18} /></button>
            </div>

            <div>
              <label className="label inline-flex items-center gap-1.5"><Smile size={14} /> Emoji</label>
              <EmojiPicker value={editing.emoji} onChange={(em) => setEditing({ ...editing, emoji: em })} />
            </div>

            <div><label className="label">Label</label>
              <input className="input" required value={editing.label}
                     onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
            </div>
            <div><label className="label">Key (slug)</label>
              <input className="input" placeholder="auto-generated from label if empty"
                     value={editing.key || ''}
                     onChange={(e) => setEditing({ ...editing, key: e.target.value })}
                     disabled={!!(editing._id || editing.id)} />
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                Used in URLs (e.g. /search?category=grocery). Cannot be changed once created.
              </p>
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
                <span>Active</span>
              </label>
            </div>

            <button className="btn-primary w-full"><Check size={14} /> Save</button>
          </form>
        </div>
      )}
    </div>
  );
}
