import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { getSocket } from '../../lib/socket.js';
import ProgressBar from '../../components/ProgressBar.jsx';
import { formatMoney, STAGE_LABELS } from '../../lib/helpers.js';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState({ status: '', from: '', to: '' });
  const [opened, setOpened] = useState(null);

  const load = () => {
    const params = {};
    if (filter.status) params.status = filter.status;
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;
    api.get('/orders/seller', { params }).then(({ data }) => setOrders(data.orders));
  };
  useEffect(() => { load(); }, [filter]);

  useEffect(() => {
    const s = getSocket(); if (!s) return;
    const onStage = () => load();
    s.on('order:stage', onStage);
    s.on('notify', (n) => { if (n.type === 'order:new') load(); });
    return () => s.off('order:stage', onStage);
    // eslint-disable-next-line
  }, []);

  const act = async (id, action) => {
    try {
      await api.post(`/orders/${id}/${action}`);
      toast.success('Updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Incoming orders</h1>
      <div className="card p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Status</label>
          <select className="input" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="">All</option>
            {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div><label className="label">From</label><input type="date" className="input" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} /></div>
        <div><label className="label">To</label><input type="date" className="input" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} /></div>
      </div>

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o._id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold">#{o._id.slice(-6).toUpperCase()} · {o.buyer?.name}</div>
                <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()} · 📍 {o.deliveryLocation.address}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatMoney(o.total)}</div>
                <div className="text-xs text-slate-500">{o.cancelledAt ? 'Cancelled' : STAGE_LABELS[o.currentStage]}</div>
              </div>
            </div>
            <ul className="text-sm mt-2 list-disc pl-5 text-slate-600">
              {o.items.map((it, i) => <li key={i}>{it.name} × {it.qty}</li>)}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {!o.cancelledAt && o.currentStage === 'placed' && (
                <button onClick={() => act(o._id, 'accept')} className="btn-primary text-sm">Accept & Prepare</button>
              )}
              {!o.cancelledAt && o.currentStage === 'preparing' && (
                <button onClick={() => act(o._id, 'ready')} className="btn-primary text-sm">Mark Ready for Pickup</button>
              )}
              <button onClick={() => setOpened(opened === o._id ? null : o._id)} className="btn-secondary text-sm">
                {opened === o._id ? 'Hide' : 'Show'} progress
              </button>
            </div>
            {opened === o._id && (
              <div className="mt-3"><ProgressBar currentStage={o.currentStage} stages={o.stages} cancelled={!!o.cancelledAt} /></div>
            )}
          </div>
        ))}
        {!orders.length && <div className="text-slate-500 py-10 text-center">No orders.</div>}
      </div>
    </div>
  );
}
