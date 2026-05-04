import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { formatMoney, STAGE_LABELS } from '../../lib/helpers.js';

export default function SellerDashboard() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get('/orders/seller').then(({ data }) => setOrders(data.orders));
  }, []);

  const completed = orders.filter((o) => o.currentStage === 'delivered_paid');
  const totalCashCollected = completed.reduce((s, o) => s + o.total, 0);
  const active = orders.filter((o) => !o.cancelledAt && o.currentStage !== 'delivered_paid').length;

  const stats = [
    { label: 'Total orders', value: orders.length },
    { label: 'Active', value: active },
    { label: 'Completed', value: completed.length },
    { label: 'Cash collected (by riders)', value: formatMoney(totalCashCollected) },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>
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
        {orders.slice(0, 5).map((o) => (
          <div key={o._id} className="card p-3 flex justify-between">
            <div>
              <div className="font-medium">#{o._id.slice(-6).toUpperCase()} · {o.buyer?.name}</div>
              <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatMoney(o.total)}</div>
              <div className="text-xs text-slate-500">{STAGE_LABELS[o.currentStage]}</div>
            </div>
          </div>
        ))}
        {!orders.length && <div className="text-sm text-slate-500">No orders yet.</div>}
      </div>
    </div>
  );
}
