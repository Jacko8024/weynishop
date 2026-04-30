import { Link } from 'react-router-dom';
import { Heart, Truck, Users, Sparkles } from 'lucide-react';
import useDocumentTitle from '../../lib/useDocumentTitle.js';

export default function AboutPage() {
  useDocumentTitle(
    'About us',
    'Learn about WeyniShop — our mission to bring local Ethiopian sellers, riders and buyers together with simple cash-on-delivery shopping.'
  );

  const values = [
    { icon: <Truck size={22} />, title: 'Cash on Delivery', text: 'No cards, no online wallets. Pay the rider in cash when your order arrives at your door.' },
    { icon: <Users size={22} />, title: 'Made for Ethiopia', text: 'Local sellers, local riders, local language. Built around how people already shop and ship.' },
    { icon: <Sparkles size={22} />, title: 'Fair to sellers', text: 'A small, transparent listing fee — no hidden cuts on every order. Sellers keep what they earn.' },
    { icon: <Heart size={22} />, title: 'Community first', text: 'Every order supports a small business. Every delivery feeds a rider. We grow together.' },
  ];

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-8 md:py-12 space-y-12">
      <header className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 font-localized">
          Local. Fresh. Delivered.
        </h1>
        <p className="text-base md:text-lg" style={{ color: 'var(--color-muted)' }}>
          WeyniShop is Ethiopia's neighbourhood marketplace. We connect sellers, riders and buyers
          in a single, simple cash-on-delivery experience — no cards, no foreign wallets,
          no friction.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {values.map((v) => (
          <div key={v.title} className="card p-5">
            <div className="w-11 h-11 rounded-xl grid place-items-center text-white mb-3"
                 style={{ background: 'var(--color-brand)' }}>
              {v.icon}
            </div>
            <h3 className="font-bold mb-1.5">{v.title}</h3>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{v.text}</p>
          </div>
        ))}
      </section>

      <section className="card p-6 md:p-10 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-bold mb-3">Our story</h2>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-muted)' }}>
            We started WeyniShop because online shopping in Ethiopia shouldn't require a credit
            card or a complicated payment app. Our founders are sellers, buyers and riders
            themselves — we know the streets, the customers, and the trust it takes to leave a
            package at someone's door.
          </p>
          <p className="text-sm md:text-base mt-3" style={{ color: 'var(--color-muted)' }}>
            Today, thousands of products from local shops reach customers across Addis and beyond,
            paid for with the most universal currency of all: cash, in hand, when it arrives.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-3">Our mission</h2>
          <p className="text-sm md:text-base" style={{ color: 'var(--color-muted)' }}>
            To put every neighbourhood shop in Ethiopia online — and every customer one tap away
            from their goods — without forcing anyone to change how they pay.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/search" className="btn-primary text-sm">Start shopping</Link>
            <Link to="/contact" className="btn-secondary text-sm">Contact us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
