import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { getSocket } from '../../lib/socket.js';
import MapView from '../../components/MapView.jsx';
import { STAGE_LABELS } from '../../lib/helpers.js';

export default function AdminLiveMap() {
  const [orders, setOrders] = useState([]);
  const [livePos, setLivePos] = useState({}); // { userId: {lat,lng} }

  const load = () => api.get('/admin/live-deliveries').then(({ data }) => setOrders(data.orders));
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    const s = getSocket();
    if (s) {
      s.on('admin:delivery_location', ({ userId, lng, lat }) => {
        setLivePos((m) => ({ ...m, [userId]: { lat, lng } }));
      });
      s.on('admin:order_stage', () => load());
    }
    return () => {
      clearInterval(t);
      if (s) { s.off('admin:delivery_location'); s.off('admin:order_stage'); }
    };
  }, []);

  const markers = orders.flatMap((o) => {
    const arr = [];
    const dp = o.deliveryPerson;
    const dpId = dp?.id ?? dp?._id;
    const live = dpId ? livePos[dpId] : null;
    const fallback =
      dp && dp.currentLat != null && dp.currentLng != null
        ? { lat: Number(dp.currentLat), lng: Number(dp.currentLng) }
        : null;
    const pos = live || fallback;
    if (pos)
      arr.push({
        key: `dp-${o.id ?? o._id}`,
        position: pos,
        label: dp?.name?.[0] || 'D',
      });
    return arr;
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Live deliveries</h1>
      <MapView height={500} markers={markers} zoom={12} />
      <div className="grid md:grid-cols-2 gap-3 mt-4">
        {orders.map((o) => (
          <div key={o._id} className="card p-3 text-sm">
            <div className="font-semibold">#{o._id.slice(-6).toUpperCase()} · {STAGE_LABELS[o.currentStage]}</div>
            <div>👤 Buyer: {o.buyer?.name}</div>
            <div>🏬 Seller: {o.seller?.shopName || o.seller?.name}</div>
            <div>🛵 Rider: {o.deliveryPerson?.name || '—'}</div>
          </div>
        ))}
        {!orders.length && <div className="text-slate-500">No active deliveries.</div>}
      </div>
    </div>
  );
}
