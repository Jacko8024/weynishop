import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, LayoutGrid, Search, ShoppingCart, User } from 'lucide-react';
import { useAuth } from '../../store/auth.js';

/**
 * Persistent bottom tab bar — Home · Categories · Search · Cart · Account.
 * Fixed above the Android/iOS gesture area via .safe-bottom.
 */
export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { user, cart } = useAuth();
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const tabs = [
    { to: '/', label: t('nav.home'), Icon: Home, match: (p) => p === '/' },
    { to: '/categories', label: t('nav.categories'), Icon: LayoutGrid, match: (p) => p.startsWith('/categories') },
    { to: '/search', label: t('nav.searchLabel'), Icon: Search, match: (p) => p.startsWith('/search') },
    {
      to: user ? '/buyer/cart' : '/login',
      label: t('nav.cart'),
      Icon: ShoppingCart,
      match: (p) => p.startsWith('/buyer/cart'),
      badge: cartCount,
    },
    { to: '/account', label: t('nav.account'), Icon: User, match: (p) => p.startsWith('/account') },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 safe-bottom md:hidden"
      style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
      }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-5">
        {tabs.map(({ to, label, Icon, match, badge }) => {
          const active = match(pathname);
          return (
            <Link
              key={label}
              to={to}
              aria-current={active ? 'page' : undefined}
              className="relative h-[54px] flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{ color: active ? 'var(--color-brand)' : 'var(--color-muted)' }}
            >
              <span className="relative">
                <Icon size={21} strokeWidth={active ? 2.4 : 1.8} />
                {badge > 0 && (
                  <span
                    className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-0.5 text-[9px] font-bold rounded-full grid place-items-center text-white"
                    style={{ background: 'var(--color-brand)' }}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </span>
              <span className={`text-[10px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
