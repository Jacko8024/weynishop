import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { api } from '../../api/client.js';
import { formatMoney, STAGE_LABELS } from '../../lib/helpers.js';

export default function AdminDashboard() {
  const [a, setA] = useState(null);
  const [orders, setOrders] = useState([]);
  const [surprise, setSurprise] = useState([]);

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setA(data));
    api.get('/admin/orders').then(({ data }) => setOrders(data.orders.slice(0, 10)));
    api.get('/surprise/admin', { params: { limit: 5 } })
      .then(({ data }) => setSurprise(data.items || []))
      .catch(() => {});
  }, []);

  if (!a) return <div className="py-10 text-center text-slate-500">Loading…</div>;

  const stats = [
    { label: 'Total orders', value: a.totalOrders },
    { label: 'Active orders', value: a.activeOrders },
    { label: 'Completed', value: a.completed },
    { label: 'Revenue (cash)', value: formatMoney(a.revenue) },
    { label: 'Buyers', value: a.usersByRole.buyer || 0 },
    { label: 'Sellers', value: a.usersByRole.seller || 0 },
    { label: 'Delivery', value: a.usersByRole.delivery || 0 },
    { label: 'Products', value: a.totalProducts },
    { label: 'Surprise requests', value: a.surpriseBookings },
    { label: 'Surprise (new)', value: a.surpriseNew },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className="text-xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Recent shop orders</h2>
          </div>
          <div className="space-y-2">
            {orders.map((o) => (
              <div key={o._id} className="card p-3 flex justify-between text-sm">
                <div>
                  <div className="font-medium">#{o._id.slice(-6).toUpperCase()} · {o.buyer?.name} → {o.seller?.shopName || o.seller?.name}</div>
                  <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatMoney(o.total)}</div>
                  <div className="text-xs text-slate-500">{o.cancelledAt ? 'Cancelled' : STAGE_LABELS[o.currentStage]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold flex items-center gap-1.5">
              <Gift size={16} style={{ color: 'var(--color-brand)' }} /> Surprise bookings
              <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>
                {a.surpriseNew} new
              </span>
            </h2>
            <Link to="/admin/surprise" className="text-xs" style={{ color: 'var(--color-brand)' }}>Manage →</Link>
          </div>
          <div className="space-y-2">
            {surprise.map((b) => (
              <div key={b.id} className="card p-3 flex justify-between text-sm">
                <div>
                  <div className="font-medium">🎁 {b.name} · {b.phone}</div>
                  <div className="text-xs text-slate-500">
                    {b.serviceType}{b.provider ? ` · ${b.provider}` : ''}{b.price != null ? ` · $${Number(b.price)}` : ''}
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>{b.status}</span>
                  <div className="text-xs text-slate-500 mt-1">{new Date(b.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {!surprise.length && (
              <div className="card p-3 text-sm text-slate-500">No surprise bookings yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}