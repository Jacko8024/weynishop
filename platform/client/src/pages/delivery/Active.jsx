import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Navigation } from 'lucide-react';
import { api } from '../../api/client.js';
import { getSocket } from '../../lib/socket.js';
import ProgressBar from '../../components/ProgressBar.jsx';
import MapView from '../../components/MapView.jsx';
import { formatMoney, STAGE_LABELS } from '../../lib/helpers.js';

const ACTIONS = {
  ready_for_pickup: { label: 'Mark Picked Up', api: 'pickup' },
  picked_up: { label: 'Out for Delivery', api: 'out' },
  out_for_delivery: { label: 'Delivered & Cash Collected', api: 'delivered' },
};

export default function DeliveryActive() {
  const [order, setOrder] = useState(null);
  const [pos, setPos] = useState(null);
  const watchId = useRef(null);
  const intervalRef = useRef(null);

  const load = async () => {
    const { data } = await api.get('/orders/delivery');
    const active = data.orders.find((o) => !o.cancelledAt && o.currentStage !== 'delivered_paid');
    setOrder(active || null);
    return active;
  };

  useEffect(() => {
    load();
    const s = getSocket();
    if (s) s.on('order:stage', () => load());
    return () => { if (s) s.off('order:stage'); };
  }, []);

  // Join socket room for the active order
  useEffect(() => {
    const s = getSocket();
    if (!s || !order?._id) return;
    s.emit('order:join', { orderId: order._id });
    return () => s.emit('order:leave', { orderId: order._id });
  }, [order?._id]);

  // GPS watcher: emit every 5 seconds during stages picked_up / out_for_delivery
  useEffect(() => {
    const isActiveTransport =
      order && ['picked_up', 'out_for_delivery'].includes(order.currentStage);

    if (!isActiveTransport) {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      watchId.current = null; intervalRef.current = null;
      return;
    }
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    intervalRef.current = setInterval(() => {
      const s = getSocket();
      if (s && pos) s.emit('delivery:location', { orderId: order._id, lng: pos.lng, lat: pos.lat });
    }, 5000);

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line
  }, [order?.currentStage, order?._id, pos?.lat, pos?.lng]);

  const advance = async () => {
    if (!order) return;
    const action = ACTIONS[order.currentStage];
    if (!action) return;
    try {
      await api.post(`/orders/${order._id}/${action.api}`);
      toast.success('Updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (!order) return <div className="card p-10 text-center text-slate-500">No active delivery. Check the Available tab.</div>;

  const pickup = { lat: order.pickupLocation.coordinates[1], lng: order.pickupLocation.coordinates[0] };
  const drop = { lat: order.deliveryLocation.coordinates[1], lng: order.deliveryLocation.coordinates[0] };
  const target = order.currentStage === 'ready_for_pickup' ? pickup : drop;
  const action = ACTIONS[order.currentStage];

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving`;

  const markers = [
    { key: 'p', position: pickup, label: 'S' },
    { key: 'd', position: drop, label: 'B' },
  ];
  if (pos) markers.push({ key: 'me', position: pos, icon: { path: 0, scale: 8, fillColor: '#f97316', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 } });

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold">#{order._id.slice(-6).toUpperCase()}</div>
            <div className="text-xs text-slate-500">{STAGE_LABELS[order.currentStage]}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-brand-600">{formatMoney(order.total)}</div>
            <div className="text-[10px] text-slate-500">cash to collect</div>
          </div>
        </div>
      </div>

      <ProgressBar currentStage={order.currentStage} stages={order.stages} />

      <div className="card p-3 text-sm">
        <div><strong>Buyer:</strong> {order.buyer?.name} · {order.buyer?.phone || ''}</div>
        <div><strong>Pickup:</strong> {order.pickupLocation?.address}</div>
        <div><strong>Drop-off:</strong> {order.deliveryLocation?.address}</div>
      </div>

      <MapView
        height={300}
        center={pos || pickup}
        markers={markers}
        route={pos ? { origin: pos, destination: target } : null}
      />

      <a href={navUrl} target="_blank" rel="noreferrer" className="btn-secondary w-full">
        <Navigation size={16} /> Open in Google Maps
      </a>

      {action && (
        <button className="btn-primary w-full text-base py-3" onClick={advance}>
          {action.label}
        </button>
      )}
      {order.currentStage === 'placed' || order.currentStage === 'preparing' ? (
        <div className="text-xs text-center text-slate-500">Waiting for seller to mark order ready…</div>
      ) : null}
    </div>
  );
}
