import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import Logo from './Logo.jsx';

const NAV = [
  {
    title: 'Shop',
    links: [
      { to: '/', label: 'Home' },
      { to: '/search', label: 'All products' },
      { to: '/deals', label: 'Flash deals' },
      { to: '/wishlist', label: 'My wishlist' },
      { to: '/weynishop.apk', label: '📱 Download Android App', download: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/contact', label: 'Contact' },
      { to: '/faq', label: 'Help & FAQ' },
      { to: '/blog', label: 'Blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/terms', label: 'Terms' },
      { to: '/privacy', label: 'Privacy' },
      { to: '/delete-account', label: 'Delete Account & Data' },
    ],
  },
];

export default function Footer() {
  const { t } = useTranslation();
  return (
    <>
      <footer
        className="mt-12 pt-10 pb-6"
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        <div className="max-w-page mx-auto px-3 md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2">
              <Logo height={36} />
              <p
                className="mt-3 text-sm max-w-xs"
                style={{ color: "var(--color-muted)" }}
              >
                Ethiopia's neighbourhood marketplace. Shop from local sellers,
                pay in cash on delivery.
              </p>
              <ul
                className="mt-4 space-y-2 text-sm"
                style={{ color: "var(--color-muted)" }}
              >
                <li className="flex items-center gap-2">
                  <Mail size={14} />{" "}
                  <a
                    className="hover:underline"
                    href="mailto:hello@weynishopping.com"
                  >
                    hello@weynishopping.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} />{" "}
                  <a className="hover:underline" href="tel:+251952655404">
                    +251 952 655 404
                  </a>
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
                      {l.download ? (
                        <a
                          href={l.to}
                          download="weynishop.apk"
                          className="text-sm hover:text-brand-700 font-medium"
                          style={{ color: "var(--color-brand)" }}
                        >
                          {l.label}
                        </a>
                      ) : (
                        <Link
                          to={l.to}
                          className="text-sm hover:text-brand-700"
                          style={{ color: "var(--color-muted)" }}
                        >
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="flex flex-col md:flex-row items-center justify-between gap-4 pt-5 text-xs"
            style={{
              color: "var(--color-muted)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <div>
              © {new Date().getFullYear()} {t('brand.name')}. {t('brand.rights')} ·
              Made in Ethiopia 🇪🇹
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/share/1ChhMsmGrb/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-brand-700"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.instagram.com/weynishop"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-brand-700"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@weynishop.berut"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="hover:text-brand-700"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
