import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { formatMoney } from '../../lib/helpers.js';

export default function DeliveryAvailable() {
  const [orders, setOrders] = useState([]);
  const [earn, setEarn] = useState({ deliveriesCompleted: 0, totalCashHandled: 0 });
  const nav = useNavigate();

  const load = () => {
    api.get('/delivery/available').then(({ data }) => setOrders(data.orders));
    api.get('/delivery/earnings').then(({ data }) => setEarn(data));
  };
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  const accept = async (orderId) => {
    try {
      await api.post(`/delivery/${orderId}/accept`);
      toast.success('Delivery accepted');
      nav('/delivery/active');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card p-3"><div className="text-xs text-slate-500">Deliveries done</div><div className="text-xl font-bold">{earn.deliveriesCompleted}</div></div>
        <div className="card p-3"><div className="text-xs text-slate-500">Cash handled</div><div className="text-xl font-bold">{formatMoney(earn.totalCashHandled)}</div></div>
      </div>

      <h1 className="text-lg font-bold mb-3">Available pickups</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o._id} className="card p-4">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">#{o._id.slice(-6).toUpperCase()}</div>
                <div className="text-xs text-slate-500">From: {o.seller?.shopName || o.seller?.name}</div>
                <div className="text-xs text-slate-500">📍 Pickup: {o.pickupLocation?.address || '—'}</div>
                <div className="text-xs text-slate-500">📍 Drop: {o.deliveryLocation?.address || '—'}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-brand-600">{formatMoney(o.total)}</div>
                <div className="text-[10px] text-slate-500">cash to collect</div>
              </div>
            </div>
            <button onClick={() => accept(o._id)} className="btn-primary w-full mt-3">Accept delivery</button>
          </div>
        ))}
        {!orders.length && <div className="text-center text-slate-500 py-10">No pickups available right now.</div>}
      </div>
    </div>
  );
}
