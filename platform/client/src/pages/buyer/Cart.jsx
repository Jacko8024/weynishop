import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../store/auth.js';
import { formatMoney } from '../../lib/helpers.js';

export default function Cart() {
  const { cart, setCartQty, removeFromCart } = useAuth();
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  if (cart.length === 0)
    return (
      <div className="card p-10 text-center">
        <div className="text-lg font-semibold mb-2">Your cart is empty</div>
        <Link to="/buyer" className="btn-primary mt-3">Start shopping</Link>
      </div>
    );

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-3">
        {cart.map((c) => (
          <div key={c.product} className="card p-3 flex items-center gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
              {c.image && <img src={c.image} alt={c.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium line-clamp-1">{c.name}</div>
              <div className="text-sm text-slate-500">{formatMoney(c.price)}</div>
            </div>
            <input
              type="number"
              min={1}
              value={c.qty}
              onChange={(e) => setCartQty(c.product, Number(e.target.value))}
              className="input w-20"
            />
            <div className="font-semibold w-24 text-right">{formatMoney(c.price * c.qty)}</div>
            <button onClick={() => removeFromCart(c.product)} className="btn-ghost text-danger-500"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
      <div className="card p-5 h-fit">
        <div className="flex justify-between mb-2">
          <span>Subtotal</span><span className="font-semibold">{formatMoney(subtotal)}</span>
        </div>
        <div className="text-xs text-slate-500 mb-4">Delivery fee calculated at checkout.</div>
        <Link to="/buyer/checkout" className="btn-primary w-full">Proceed to checkout</Link>
      </div>
    </div>
  );
}
