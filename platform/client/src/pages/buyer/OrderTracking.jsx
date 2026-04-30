import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { getSocket } from '../../lib/socket.js';
import ProgressBar from '../../components/ProgressBar.jsx';
import MapView from '../../components/MapView.jsx';
import { formatMoney, haversineKm, etaMinutes } from '../../lib/helpers.js';

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [riderPos, setRiderPos] = useState(null);

  const load = () => api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order));

  useEffect(() => {
    load();
    const socket = getSocket();
    if (!socket) return;
    socket.emit('order:join', { orderId: id });

    const onStage = (p) => {
      if (p.orderId !== id) return;
      setOrder((o) => o && { ...o, currentStage: p.currentStage, stages: p.stages });
    };
    const onLoc = (p) => {
      if (p.orderId !== id) return;
      setRiderPos({ lat: p.lat, lng: p.lng });
    };
    const onCancel = (p) => {
      if (p.orderId !== id) return;
      load();
    };

    socket.on('order:stage', onStage);
    socket.on('order:location', onLoc);
    socket.on('order:cancelled', onCancel);
    return () => {
      socket.emit('order:leave', { orderId: id });
      socket.off('order:stage', onStage);
      socket.off('order:location', onLoc);
      socket.off('order:cancelled', onCancel);
    };
  }, [id]);

  const cancel = async () => {
    if (!confirm('Cancel this order?')) return;
    try {
      await api.post(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const markers = useMemo(() => {
    if (!order) return [];
    const m = [
      {
        key: 'pickup',
        position: { lat: order.pickupLocation.coordinates[1], lng: order.pickupLocation.coordinates[0] },
        label: 'S',
      },
      {
        key: 'drop',
        position: { lat: order.deliveryLocation.coordinates[1], lng: order.deliveryLocation.coordinates[0] },
        label: 'B',
      },
    ];
    if (riderPos)
      m.push({
        key: 'rider',
        position: riderPos,
        icon: {
          path: 0, // CIRCLE
          scale: 8,
          fillColor: '#f97316',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
    return m;
  }, [order, riderPos]);

  if (!order) return <div className="py-10 text-center text-slate-500">Loading…</div>;

  const dropCoords = [order.deliveryLocation.coordinates[0], order.deliveryLocation.coordinates[1]];
  const riderCoords = riderPos ? [riderPos.lng, riderPos.lat] : null;
  const km = riderCoords ? haversineKm(riderCoords, dropCoords) : null;

  const canCancel = ['placed', 'preparing'].includes(order.currentStage) && !order.cancelledAt;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold">Order #{order._id.slice(-6).toUpperCase()}</h1>
            <div className="text-sm text-slate-500">Placed {new Date(order.createdAt).toLocaleString()}</div>
          </div>
          {canCancel && (
            <button onClick={cancel} className="btn-danger">Cancel order</button>
          )}
        </div>
        <ProgressBar currentStage={order.currentStage} stages={order.stages} cancelled={!!order.cancelledAt} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <h3 className="font-semibold mb-2">Live map</h3>
          <MapView
            height={400}
            center={riderPos || { lat: dropCoords[1], lng: dropCoords[0] }}
            markers={markers}
            route={
              riderPos && ['picked_up', 'out_for_delivery'].includes(order.currentStage)
                ? { origin: riderPos, destination: { lat: dropCoords[1], lng: dropCoords[0] } }
                : null
            }
          />
          {km != null && (
            <div className="mt-2 text-sm text-slate-600">
              Rider is <strong>{km.toFixed(1)} km</strong> away · ETA ~{etaMinutes(km)} min
            </div>
          )}
        </div>
        <div>
          <div className="card p-4">
            <h3 className="font-semibold mb-2">Items</h3>
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{it.name} × {it.qty}</span>
                <span>{formatMoney(it.price * it.qty)}</span>
              </div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Delivery</span><span>{formatMoney(order.deliveryFee)}</span></div>
            <div className="flex justify-between font-semibold mt-1"><span>Total (cash)</span><span>{formatMoney(order.total)}</span></div>
          </div>
          {order.deliveryPerson && (
            <div className="card p-4 mt-3">
              <h3 className="font-semibold mb-1">Your rider</h3>
              <div>{order.deliveryPerson.name}</div>
              <div className="text-sm text-slate-500">{order.deliveryPerson.phone || '—'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
