import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const NAV = [
  {
    title: 'Shop',
    links: [
      { to: '/', label: 'Home' },
      { to: '/search', label: 'All products' },
      { to: '/deals', label: 'Flash deals' },
      { to: '/wishlist', label: 'My wishlist' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/contact', label: 'Contact' },
      { to: '/faq', label: 'Help & FAQ' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/terms', label: 'Terms' },
      { to: '/privacy', label: 'Privacy' },
    ],
  },
];

export default function Footer() {
  return (
    <>
      {/* ── About Weynishop ── */}
      <section className="pt-16 pb-10" style={{ background: 'var(--color-surface)' }}>
        <div className="max-w-page mx-auto px-3 md:px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">About Weynishop</h2>
            <p className="text-lg md:text-xl font-medium mb-6" style={{ color: 'var(--color-muted)' }}>
              Ethiopia's Marketplace for Families at Home and Abroad
            </p>
            <p className="text-sm md:text-base leading-relaxed mb-4" style={{ color: 'var(--color-muted)' }}>
              Weynishop is an online marketplace that serves Ethiopians both in the Middle East and around the world.
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-left mt-8">
              <div className="p-5 rounded-xl" style={{ background: 'var(--color-surface-elevated, #fff)', border: '1px solid var(--color-border)' }}>
                <h3 className="font-semibold mb-2">Shop from Ethiopian businesses in Arab countries</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  We help Ethiopian merchants in Lebanon and other Arab countries sell their products online, making it easier for Ethiopian domestic workers and busy families to shop and receive deliveries without leaving home.
                </p>
              </div>
              <div className="p-5 rounded-xl" style={{ background: 'var(--color-surface-elevated, #fff)', border: '1px solid var(--color-border)' }}>
                <h3 className="font-semibold mb-2">Send gifts and surprises to loved ones in Ethiopia</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  Weynishop also allows Ethiopians living abroad to buy gifts, children's clothes, toys, furniture, cakes, flowers, and special surprises for their families in Ethiopia. Whether you're celebrating a birthday, holiday, graduation, or preparing your home before returning to Ethiopia, Weynishop helps you turn your love into meaningful gifts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer
      className="mt-12 pt-10 pb-6"
      style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="max-w-page mx-auto px-3 md:px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2">
            <img
              src="/logo/weynishopping-full.png"
              alt="WeyniShopping"
              width="140"
              height="36"
              style={{ height: 36, width: 'auto' }}
              loading="lazy"
              decoding="async"
            />
            <p className="mt-3 text-sm max-w-xs" style={{ color: 'var(--color-muted)' }}>
              Ethiopia's neighbourhood marketplace. Shop from local sellers, pay in cash on delivery.
            </p>
            <ul className="mt-4 space-y-2 text-sm" style={{ color: 'var(--color-muted)' }}>
              <li className="flex items-center gap-2">
                <Mail size={14} /> <a className="hover:underline" href="mailto:hello@weynishopping.com">hello@weynishopping.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} /> <a className="hover:underline" href="tel:+251911000000">+251 911 000 000</a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} /> Addis Ababa, Ethiopia
              </li>
            </ul>
          </div>

          {NAV.map((col) => (
            <div key={col.title}>
              <h4 className="font-bold mb-3 text-sm">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm hover:text-brand-700"
                          style={{ color: 'var(--color-muted)' }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4 pt-5 text-xs"
          style={{ color: 'var(--color-muted)', borderTop: '1px solid var(--color-border)' }}
        >
          <div>© {new Date().getFullYear()} WeyniShopping. All rights reserved. · Made in Ethiopia 🇪🇹</div>
          <div className="flex items-center gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
               aria-label="Facebook" className="hover:text-brand-700">
              <Facebook size={18} />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
               aria-label="Instagram" className="hover:text-brand-700">
              <Instagram size={18} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
               aria-label="Twitter" className="hover:text-brand-700">
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
