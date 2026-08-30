import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../store/auth.js';
import useIsMobile from '../../lib/useIsMobile.js';
import { usePrice } from '../../store/currency.js';

/**
 * Mobile-first cart: stacked item cards with touch steppers and a
 * sticky checkout bar. On desktop (md+) it falls back to the classic
 * items + side summary layout.
 */
export default function Cart() {
  const { cart, setCartQty, removeFromCart } = useAuth();
  const price = usePrice();
  const isMobile = useIsMobile();
  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);

  if (cart.length === 0)
    return (
      <div className="max-w-xl mx-auto card p-10 text-center">
        <div className="text-5xl mb-3" aria-hidden="true">🛒</div>
        <div className="text-lg font-semibold mb-1">Your cart is empty</div>
        <p className="text-sm text-slate-500 mb-4">Browse products and add them to your cart.</p>
        <Link to="/" className="btn-primary mt-2 inline-flex">Start shopping</Link>
      </div>
    );

  const items = (
    <div className="space-y-3">
      {cart.map((c) => (
        <div key={c.product} className="card p-3 flex items-center gap-3">
          {/* Image */}
          <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
            {c.image && <img src={c.image} alt={c.name} width="80" height="80" loading="lazy" className="w-full h-full object-cover" />}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link to={`/product/${c.product}`} className="font-medium line-clamp-2 text-sm leading-snug">{c.name}</Link>
            <div className="price-num font-bold text-brand-600 mt-1">{price.fmt(c.price)}</div>

            {/* Touch stepper + delete */}
            <div className="flex items-center justify-between mt-2">
              <div className="inline-flex items-center rounded-full overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <button onClick={() => setCartQty(c.product, c.qty - 1)} disabled={c.qty <= 1}
                  className="w-9 h-9 grid place-items-center disabled:opacity-40 active:bg-slate-100"
                  aria-label="Decrease quantity">
                  <Minus size={15} />
                </button>
                <span className="w-9 text-center text-sm font-semibold price-num" aria-live="polite">{c.qty}</span>
                <button onClick={() => setCartQty(c.product, c.qty + 1)}
                  className="w-9 h-9 grid place-items-center active:bg-slate-100"
                  aria-label="Increase quantity">
                  <Plus size={15} />
                </button>
              </div>
              <button onClick={() => removeFromCart(c.product)}
                className="w-10 h-10 grid place-items-center rounded-full btn-ghost text-danger-500"
                aria-label={`Remove ${c.name} from cart`}>
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <div className="pb-[150px]" style={{ paddingBottom: 'calc(150px + env(safe-area-inset-bottom, 0px))' }}>
        {items}
        {/* Sticky checkout bar */}
        <div
          className="fixed inset-x-0 z-30 px-4 pt-3"
          style={{
            bottom: 'calc(54px + env(safe-area-inset-bottom, 0px))',
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            boxShadow: '0 -4px 14px rgba(0,0,0,0.07)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Total</span>
            <span className="price-num text-lg font-extrabold" style={{ color: 'var(--color-brand)' }}>
              {price.fmt(subtotal)}
            </span>
          </div>
          <Link to="/buyer/checkout" className="btn-primary w-full h-11 rounded-full font-semibold">
            Checkout ({cart.reduce((s, c) => s + c.qty, 0)})
          </Link>
        </div>
      </div>
    );
  }

  // Desktop / tablet layout preserved
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <div className="md:col-span-2">{items}</div>
      <div className="card p-5 h-fit">
        <div className="flex justify-between py-1">
          <span>Subtotal</span><span className="price-num font-semibold">{price.fmt(subtotal)}</span>
        </div>
        <div className="text-xs text-slate-500 my-3">Delivery fee calculated at checkout.</div>
        <Link to="/buyer/checkout" className="btn-primary w-full">Proceed to checkout</Link>
      </div>
    </div>
  );
}

