import { useEffect, useState } from 'react';
import { Wallet, Package, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

const fmt = (n) => Number(n || 0).toLocaleString();

export default function DeliveryEarnings() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async (p = 1) => {
    try {
      const [s, t] = await Promise.all([
        api.get('/delivery/wallet'),
        api.get('/delivery/wallet/transactions', { params: { page: p, limit } }),
      ]);
      setSummary(s.data);
      setItems(t.data.items);
      setTotal(t.data.total);
      setPage(t.data.page);
    } catch {
      toast.error('Failed to load earnings');
    }
  };

  useEffect(() => { load(1); }, []);

  if (!summary) return <div className="py-10 text-center text-slate-500">Loading…</div>;

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet size={20} /> Money earned
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Delivery fees auto-credit to your wallet whenever an order is delivered.
        </p>
      </div>

      {/* Wallet stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Today" value={`${fmt(summary.today)} ETB`} />
        <Stat label="This month" value={`${fmt(summary.thisMonth)} ETB`} />
        <Stat label="All time" value={`${fmt(summary.total)} ETB`} highlight />
        <Stat label="Deliveries" value={summary.deliveriesCount} />
      </div>

      {/* Ledger */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Delivery ledger</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Address</th>
                <th className="p-3">Fee</th>
                <th className="p-3">Type</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3 font-medium">
                    <span className="inline-flex items-center gap-1">
                      <Package size={14} /> #{row.orderId}
                    </span>
                  </td>
                  <td className="p-3 max-w-xs truncate" title={row.order?.deliveryAddress}>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <MapPin size={14} /> {row.order?.deliveryAddress || '—'}
                    </span>
                  </td>
                  <td className={`p-3 font-semibold ${Number(row.amount) < 0 ? 'text-red-600' : ''}`}>
                    {row.amount > 0 ? '+' : ''}{fmt(row.amount)} {row.currency}
                  </td>
                  <td className="p-3">
                    <span className="badge bg-slate-100 capitalize">{row.type.replace('_', ' ')}</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                      <Calendar size={12} />
                      {new Date(row.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">No earnings yet — complete a delivery to see your first credit.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
            <span className="text-sm">{page} / {pageCount}</span>
            <button className="btn-ghost" disabled={page >= pageCount} onClick={() => load(page + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }) {
  return (
    <div className={`card p-4 ${highlight ? 'ring-2 ring-brand-300' : ''}`}>
      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</div>
      <div className="text-xl md:text-2xl font-bold mt-1" style={{ color: highlight ? 'var(--color-brand)' : 'inherit' }}>
        {value}
      </div>
    </div>
  );
}
