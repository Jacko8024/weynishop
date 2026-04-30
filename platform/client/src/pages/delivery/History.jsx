import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { formatMoney, STAGE_LABELS } from '../../lib/helpers.js';

export default function DeliveryHistory() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get('/orders/delivery').then(({ data }) => setOrders(data.orders)); }, []);

  return (
    <div>
      <h1 className="text-lg font-bold mb-3">Delivery history</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o._id} className="card p-3 flex justify-between">
            <div>
              <div className="font-medium">#{o._id.slice(-6).toUpperCase()}</div>
              <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{formatMoney(o.total)}</div>
              <div className="text-xs text-slate-500">{o.cancelledAt ? 'Cancelled' : STAGE_LABELS[o.currentStage]}</div>
            </div>
          </div>
        ))}
        {!orders.length && <div className="text-slate-500 py-10 text-center">No deliveries yet.</div>}
      </div>
    </div>
  );
}
