import { Link } from 'react-router-dom';
import { ShoppingBag, Store, Truck, Shield } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-100">
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center" aria-label="WeyniShop">
          <img src="/logo/weynishop-full.png" alt="WeyniShop" style={{ height: 36 }} />
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="btn-ghost">Log in</Link>
          <Link to="/register" className="btn-primary">Sign up</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-black tracking-tight">
          Buy local. <span className="text-brand-600">Pay cash on delivery.</span>
        </h1>
        <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto">
          A simple ecommerce platform with three connected portals — buyers, sellers, and delivery riders —
          plus real-time GPS tracking. No cards. No wallets. Just cash on delivery.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/register" className="btn-primary text-base px-6 py-3">Get started</Link>
          <Link to="/login" className="btn-secondary text-base px-6 py-3">I already have an account</Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-4 gap-4">
        {[
          { icon: <ShoppingBag />, title: 'Buyer', desc: 'Browse, order and track on a live map.' },
          { icon: <Store />, title: 'Seller', desc: 'List products, manage incoming orders.' },
          { icon: <Truck />, title: 'Delivery', desc: 'Pick up jobs near you. Earn per delivery.' },
          { icon: <Shield />, title: 'Admin', desc: 'Oversee the entire platform.' },
        ].map((c) => (
          <div key={c.title} className="card p-5">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              {c.icon}
            </div>
            <div className="font-semibold">{c.title}</div>
            <div className="text-sm text-slate-500 mt-1">{c.desc}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
