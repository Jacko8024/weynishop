import { useEffect, useState } from 'react';
import { Trash2, Phone, Mail, MapPin, Calendar, DollarSign, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

const STATUSES = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'done', label: 'Done' },
];

const STATUS_STYLE = {
  new: { background: '#FEF3C7', color: '#92400E' },
  contacted: { background: '#DBEAFE', color: '#1E40AF' },
  done: { background: '#D1FAE5', color: '#065F46' },
};

export default function SurpriseBookings() {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState(null);
  const [filter, setFilter] = useState('all');
  const [noteDraft, setNoteDraft] = useState({});
  const [busy, setBusy] = useState(false);

  const load = (status) =>
    api.get('/surprise/admin', { params: status && status !== 'all' ? { status } : {} }).then(({ data }) => {
      setItems(data.items || []);
      setCounts(data.counts);
    });

  useEffect(() => {
    load().catch(() => toast.error('Failed to load surprise bookings'));
  }, []);

  const setStatus = async (b, status) => {
    setBusy(true);
    try {
      await api.patch(`/surprise/admin/${b.id}`, { status });
      toast.success(`Marked as ${status}`);
      await load(filter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const saveNote = async (b) => {
    setBusy(true);
    try {
      await api.patch(`/surprise/admin/${b.id}`, { adminNote: noteDraft[b.id] ?? '' });
      toast.success('Note saved');
      await load(filter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (b) => {
    if (!confirm('Delete this surprise booking?')) return;
    setBusy(true);
    try {
      await api.delete(`/surprise/admin/${b.id}`);
      toast.success('Deleted');
      await load(filter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">🎁 Surprise bookings</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Surprise / representation service requests from /surprise — kept separate from shop orders.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => {
          const n = s.key === 'all' ? counts?.total : counts?.[s.key];
          return (
            <button key={s.key} onClick={() => { setFilter(s.key); load(s.key); }}
                    className={`badge px-3 py-1.5 border transition ${filter === s.key ? 'text-white' : ''}`}
                    style={filter === s.key ? { background: 'var(--color-brand)', borderColor: 'var(--color-brand)' } : { background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              {s.label} {n != null && <span className="ml-1 opacity-80">({n})</span>}
            </button>
          );
        })}
      </div>

      {!counts && <div className="py-10 text-center" style={{ color: 'var(--color-muted)' }}>Loading…</div>}

      <div className="space-y-3">
        {items.map((b) => (
          <div key={b.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{b.name}</span>
                  <span className="badge" style={STATUS_STYLE[b.status] || STATUS_STYLE.new}>{b.status}</span>
                  <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {new Date(b.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm mt-1 flex flex-wrap gap-x-4 gap-y-1" style={{ color: 'var(--color-muted)' }}>
                  <span className="inline-flex items-center gap-1"><Phone size={13} /> {b.phone}</span>
                  {b.email && <span className="inline-flex items-center gap-1"><Mail size={13} /> {b.email}</span>}
                  <span className="inline-flex items-center gap-1"><MapPin size={13} /> {b.city}</span>
                  {b.surpriseDate && <span className="inline-flex items-center gap-1"><Calendar size={13} /> {b.surpriseDate}</span>}
                  {b.price != null && <span className="inline-flex items-center gap-1"><DollarSign size={13} /> ${Number(b.price)}</span>}
                  {b.userId && <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>user #{b.userId}</span>}
                </div>
                <div className="text-sm mt-2">
                  <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>{b.serviceType}</span>
                  {b.service && <span className="badge ml-1" style={{ background: '#F3F4F6', color: '#374151' }}>service: {b.service.name}</span>}
                  {b.provider && <span className="ml-2 text-xs" style={{ color: 'var(--color-muted)' }}>{b.provider}</span>}
                </div>
                {b.notes && <p className="text-sm mt-2 whitespace-pre-wrap">{b.notes}</p>}
                {b.adminNote && (
                  <p className="text-xs mt-2 italic" style={{ color: 'var(--color-muted)' }}>
                    Admin note: {b.adminNote}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end shrink-0">
                <div className="flex gap-1">
                  {['new', 'contacted', 'done']
                    .filter((s) => s !== b.status)
                    .map((s) => (
                      <button key={s} onClick={() => setStatus(b, s)} disabled={busy}
                              className="btn-secondary text-xs">
                        <Check size={13} /> {s}
                      </button>
                    ))}
                  <button onClick={() => remove(b)} disabled={busy} className="btn-danger text-xs">
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex gap-1 w-full">
                  <input className="input !py-1.5 text-xs flex-1" placeholder="Admin note..."
                         value={noteDraft[b.id] ?? b.adminNote ?? ''}
                         onChange={(e) => setNoteDraft((d) => ({ ...d, [b.id]: e.target.value }))} />
                  <button onClick={() => saveNote(b)} disabled={busy} className="btn-secondary text-xs">
                    {busy ? <Loader2 size={13} className="animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {counts && !items.length && (
          <div className="text-center py-10" style={{ color: 'var(--color-muted)' }}>
            No surprise bookings{filter !== 'all' ? ` with status "${filter}"` : ''} yet.
          </div>
        )}
      </div>
    </div>
  );
}