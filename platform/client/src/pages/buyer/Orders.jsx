import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { formatMoney, STAGE_LABELS } from '../../lib/helpers.js';

export default function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => setOrders(data.orders));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">My orders</h1>
      {orders.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o._id} to={`/buyer/orders/${o._id}`} className="card p-4 flex items-center justify-between hover:shadow">
              <div>
                <div className="font-semibold">Order #{o._id.slice(-6).toUpperCase()}</div>
                <div className="text-sm text-slate-500">
                  {o.items.length} items · {new Date(o.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatMoney(o.total)}</div>
                <div className="text-xs">
                  {o.cancelledAt ? (
                    <span className="badge bg-danger-100 text-danger-700">Cancelled</span>
                  ) : (
                    <span className="badge bg-brand-50 text-brand-700">{STAGE_LABELS[o.currentStage]}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
