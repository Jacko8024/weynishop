import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, X, Upload, Loader2, Inbox, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

const PINK = '#e63956';

const GROUP_PRESETS = [
  { id: 'birthday', title: 'ለልደት እና እንዲሁ ሰርፕራይዝ ለማድረግ', subtitle: 'Birthday / surprise representation' },
  { id: 'event', title: 'ለሀዘን, ለደስታ (ድግስ) ወይንም የታመመ ለመጠየቅ', subtitle: 'Funeral / feast / health visit' },
  { id: 'gift', title: 'ስጦታ ማድረስ (Gift Delivery)', subtitle: 'Gift delivery' },
  { id: 'proposal', title: 'Proposal & Anniversary', subtitle: 'Proposal / anniversary surprises' },
];

const emptyForm = {
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

export default function SellerSurprise() {
  const [access, setAccess] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsCount, setBookingsCount] = useState({ new: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const loadMy = async () => {
    setLoading(true);
    try {
      const [svc, bk] = await Promise.all([api.get('/surprise/my'), api.get('/surprise/my/bookings')]);
      setServices(svc.data.services || []);
      setBookings(bk.data.items || []);
      setBookingsCount(bk.data.counts || { new: 0, total: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load surprise data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/surprise/access')
      .then(({ data }) => {
        setAccess(data.allowed);
        if (data.allowed) loadMy();
      })
      .catch(() => setAccess(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!editing.image) return toast.error('Please upload a service image');
    setBusy(true);
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
        await api.put(`/surprise/my/${editing.id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/surprise/my', payload);
        toast.success('Posted — now visible on /surprise');
      }
      setEditing(null);
      loadMy();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    setBusy(true);
    try {
      await api.delete(`/surprise/my/${s.id}`);
      toast.success('Deleted');
      loadMy();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (s) => {
    try {
      await api.put(`/surprise/my/${s.id}`, { isActive: !s.isActive });
      loadMy();
    } catch { toast.error('Failed'); }
  };

  const setBookingStatus = async (b, status) => {
    try {
      await api.patch(`/surprise/my/bookings/${b.id}`, { status });
      toast.success('Status updated');
      loadMy();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const onPickGroup = (gid) => {
    const preset = GROUP_PRESETS.find((g) => g.id === gid);
    setEditing((cur) => ({ ...cur, groupId: gid, ...(preset ? { groupTitle: preset.title } : {}) }));
  };

  const onPickFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/uploads/surprise', fd, {
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

  if (access === null) {
    return (
      <div className="py-20 text-center" style={{ color: 'var(--color-muted)' }}>
        <Loader2 className="animate-spin mx-auto" />
      </div>
    );
  }

  if (!access) {
    return (
      <div className="card max-w-lg mx-auto mt-10 p-8 text-center space-y-4">
        <Gift size={36} className="mx-auto" style={{ color: PINK }} />
        <h2 className="text-lg font-bold">Surprise page is managed by one merchant account</h2>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          የሰርፕራይዝ ገጹን የሚያስተዳድረው አንድ የወይኒገበያ ነጋዴ አካውንት ብቻ ነው። የሰርፕራይዝ ገጽ ባለቤት ከሆኑ እባክዎ አድሚንን ያነጋግሩ።
        </p>
        <Link to="/seller" className="btn-ghost text-sm inline-block">← Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-bold text-lg">🎁 Surprise page</div>
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {services.length} አገልግሎቶች · {bookingsCount.new} አዲስ ቅጽ (total {bookingsCount.total})
          </div>
        </div>
        <button className="btn-primary text-sm" onClick={() => setEditing({ ...emptyForm })}>
          <Plus size={16} /> New service
        </button>
      </div>

      {/* ── MY SERVICES ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold">የእርስዎ አገልግሎቶች (My services)</h2>
        {loading && <div className="card p-6 text-center"><Loader2 className="animate-spin mx-auto" /></div>}
        {!loading && services.map((s) => (
          <div key={s.id} className="card p-3 flex items-center gap-3">
            {s.image && <img src={s.image} alt={s.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold truncate">{s.name}</span>
                {!s.isActive && <span className="badge bg-slate-700 text-white">Hidden</span>}
                <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>{s.groupId}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                ⭐ {Number(s.rating)} · ${Number(s.price)} · {new Date(s.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing({
                groupId: s.groupId, groupTitle: s.groupTitle, groupSubtitle: s.groupSubtitle,
                name: s.name, image: s.image, rating: Number(s.rating), price: Number(s.price),
                featuresText: (s.features || []).join('\n'), displayOrder: s.displayOrder,
                isActive: s.isActive, id: s.id,
              })} className="btn-secondary text-xs"><Edit size={14} /> Edit</button>
              <button onClick={() => toggleActive(s)} className="btn-ghost text-xs" title={s.isActive ? 'Hide' : 'Show'}>
                {s.isActive ? '🙈' : '👁️'}
              </button>
              <button onClick={() => remove(s)} className="btn-danger text-xs"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {!loading && !services.length && (
          <div className="card p-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
            እስካሁን ምንም አገልግሎት አልለጠፉም። "New service" ተጭነው ይጀምሩ።
          </div>
        )}
      </section>

      {/* ── MY BOOKING FORMS ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Inbox size={18} style={{ color: PINK }} /> የደረሱ ቅጾች (Booking forms)
          {bookingsCount.new > 0 && (
            <span className="badge" style={{ background: PINK, color: '#fff' }}>{bookingsCount.new} new</span>
          )}
        </h2>
        {!loading && bookings.length === 0 && (
          <div className="card p-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
            እስካሁን ቅጽ አልደረሰም። ሰዎች በ /surprise ላይ አገልግሎት መርጠው ሲሞሉ እዚህ ይታያል።
          </div>
        )}
        {bookings.map((b) => (
          <div key={b.id} className="card p-4 space-y-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="font-semibold">
                {b.name} <span className="text-xs font-normal" style={{ color: 'var(--color-muted)' }}>({b.phone})</span>
                {b.service && <span className="badge ml-2" style={{ background: '#F3F4F6', color: '#374151' }}>{b.service.name}</span>}
              </div>
              <div className="flex items-center gap-2">
                {b.status === 'new' && <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>New</span>}
                {b.status === 'contacted' && <span className="badge" style={{ background: '#DBEAFE', color: '#1E40AF' }}>Contacted</span>}
                {b.status === 'done' && <span className="badge" style={{ background: '#D1FAE5', color: '#065F46' }}>Done</span>}
              </div>
            </div>
            <div className="text-sm grid sm:grid-cols-2 gap-1" style={{ color: 'var(--color-muted)' }}>
              <span>📧 {b.email || '—'}</span>
              <span>📅 {b.surpriseDate || '—'}</span>
              <span>📍 {b.city || '—'}</span>
              <span>💰 ${b.price != null ? Number(b.price) : '—'}</span>
              {b.notes && <span className="sm:col-span-2">📝 {b.notes}</span>}
            </div>
            <div className="flex gap-2 pt-1">
              {b.status !== 'contacted' && (
                <button className="btn-secondary text-xs" onClick={() => setBookingStatus(b, 'contacted')}>Mark contacted</button>
              )}
              {b.status !== 'done' && (
                <button className="btn-secondary text-xs" onClick={() => setBookingStatus(b, 'done')}>Mark done</button>
              )}
            </div>
          </div>
        ))}
      </section>

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
                  {[...new Set(services.map((s) => s.groupId))].filter((g) => !GROUP_PRESETS.some((p) => p.id === g)).map((g) => (
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
              <label className="label">Group title</label>
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
                <input className="input" type="number" step="0.1" min="0" max="5" value={editing.rating}
                       onChange={(e) => setEditing({ ...editing, rating: e.target.value })} />
              </div>
              <div>
                <label className="label">Price ($)</label>
                <input className="input" type="number" min="0" value={editing.price}
                       onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
              </div>
              <div>
                <label className="label">Order</label>
                <input className="input" type="number" min="0" value={editing.displayOrder}
                       onChange={(e) => setEditing({ ...editing, displayOrder: e.target.value })} />
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

            <button className="w-full text-white font-semibold py-3 rounded-lg" style={{ background: PINK }}
                    disabled={busy || uploading}>
              <Loader2 size={16} className="inline animate-spin" hidden={!busy} /> {editing.id ? 'Save changes' : 'Post service'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
