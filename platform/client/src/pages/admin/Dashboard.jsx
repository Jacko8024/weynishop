import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { formatMoney, STAGE_LABELS } from '../../lib/helpers.js';

export default function AdminDashboard() {
  const [a, setA] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setA(data));
    api.get('/admin/orders').then(({ data }) => setOrders(data.orders.slice(0, 10)));
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

      <h2 className="font-semibold mb-2">Recent orders</h2>
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
  );
}
