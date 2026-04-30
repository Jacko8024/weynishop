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
    <footer
      className="mt-12 pt-10 pb-6"
      style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
    >
      <div className="max-w-page mx-auto px-3 md:px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2">
            <img
              src="/logo/weynishop-full.png"
              alt="WeyniShop"
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
                <Mail size={14} /> <a className="hover:underline" href="mailto:hello@weynishop.com">hello@weynishop.com</a>
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
          <div>© {new Date().getFullYear()} WeyniShop. All rights reserved. · Made in Ethiopia 🇪🇹</div>
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
  );
}
