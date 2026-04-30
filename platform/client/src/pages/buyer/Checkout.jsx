import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import { formatMoney } from '../../lib/helpers.js';
import MapView, { AddressPicker } from '../../components/MapView.jsx';

export default function Checkout() {
  const { cart, clearCart, user } = useAuth();
  const nav = useNavigate();
  const [addr, setAddr] = useState(
    user?.defaultAddress?.coordinates
      ? {
          lat: user.defaultAddress.coordinates[1],
          lng: user.defaultAddress.coordinates[0],
          address: user.defaultAddress.address,
        }
      : null
  );
  const [placing, setPlacing] = useState(false);

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  const place = async () => {
    if (!cart.length) return toast.error('Cart is empty');
    if (!addr?.lat) return toast.error('Pick a delivery address');
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        items: cart.map((c) => ({ product: c.product, qty: c.qty })),
        deliveryLocation: { coordinates: [addr.lng, addr.lat], address: addr.address },
      });
      clearCart();
      toast.success('Order placed!');
      nav(`/buyer/orders/${data.orders[0]._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-lg font-bold mb-3">Delivery address</h2>
        <AddressPicker
          defaultValue={addr?.address || ''}
          onChange={(v) => v.lat && setAddr(v)}
          placeholder="Search your address…"
        />
        <div className="text-xs text-slate-500 mt-1">Or tap on the map to drop a pin.</div>
        <div className="mt-3">
          <MapView
            height={300}
            center={addr ? { lat: addr.lat, lng: addr.lng } : undefined}
            markers={addr ? [{ key: 'me', position: { lat: addr.lat, lng: addr.lng } }] : []}
            onClick={(p) => setAddr({ ...p, address: addr?.address || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` })}
          />
        </div>
        {addr?.address && <div className="text-sm text-slate-600 mt-2">📍 {addr.address}</div>}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Order summary</h2>
        <div className="card p-4 space-y-2">
          {cart.map((c) => (
            <div key={c.product} className="flex justify-between text-sm">
              <span>{c.name} × {c.qty}</span>
              <span>{formatMoney(c.price * c.qty)}</span>
            </div>
          ))}
          <hr />
          <div className="flex justify-between font-semibold">
            <span>Subtotal</span><span>{formatMoney(subtotal)}</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="font-semibold text-amber-900">💵 Cash on Delivery</div>
          <div className="text-sm text-amber-800 mt-1">
            You'll pay the delivery rider in cash when your order arrives. No cards or online payments.
          </div>
        </div>

        <button onClick={place} disabled={placing} className="btn-primary w-full mt-4 text-base py-3">
          {placing ? 'Placing order…' : 'Place order (Cash on Delivery)'}
        </button>
      </div>
    </div>
  );
}
