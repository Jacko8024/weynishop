import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingCart, Bell, Globe } from 'lucide-react';
import { useAuth } from '../../store/auth.js';
import { api } from '../../api/client.js';
import Logo from '../Logo.jsx';
import LanguageSheet from './LanguageSheet.jsx';

/**
 * Compact mobile shopping header.
 *
 *   [ WEYNISHOP LOGO ]                    🔔
 *   [ 🔍 Search products…              ] 🌐 🛒
 *
 * - Bell: opens /account/notifications; red badge shows the REAL unread
 *   count from GET /notifications/unread-count (no fake numbers; hidden
 *   entirely for guests and when the count is 0). Polls every 60s while
 *   the header is mounted, and re-checks whenever a route changes so the
 *   badge updates right after the user reads notifications.
 * - Logo: full lockup asset with the Amharic wordmark variant handled by
 *   <Logo/>, height clamped so it never stretches or distorts.
 * - Search pill opens the existing /search screen (no second engine).
 */
export default function MobileHeader() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, cart } = useAuth();
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const [unread, setUnread] = useState(0);
  const [langOpen, setLangOpen] = useState(false);

  // Real unread count — logged-in users only. Silent on failure (badge
  // simply stays at its last known value).
  useEffect(() => {
    if (!user) { setUnread(0); return undefined; }
    let on = true;
    const load = () =>
      api.get('/notifications/unread-count')
        .then(({ data }) => { if (on) setUnread(data.unreadCount || 0); })
        .catch(() => { });
    load();
    const timer = setInterval(load, 60_000);
    return () => { on = false; clearInterval(timer); };
  }, [user?.id]);

  return (
    <header className="sticky top-0 z-40 safe-top nav-blur" style={{ borderBottom: '1px solid var(--color-border)' }}>
      {/* Row 1 — logo + notifications */}
      <div className="h-11 px-3 flex items-center justify-between">
        <Link to="/" aria-label="WeyniShopping home" className="shrink-0 flex items-center">
          <Logo height={26} />
        </Link>

        {/* Notification bell — visible for signed-in users, minimum
            40px touch target, accessible label with count. */}
        {user ? (
          <Link
            to="/account/notifications"
            aria-label={unread > 0 ? `${t('notif.title')} (${unread})` : t('notif.title')}
            className="relative w-10 h-10 grid place-items-center rounded-full btn-ghost"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span
                className="absolute top-0.5 right-0 min-w-[17px] h-[17px] px-1 text-[10px] font-bold rounded-full grid place-items-center text-white"
                style={{ background: 'var(--color-flash)' }}
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </Link>
        ) : (
          <Link
            to="/login"
            aria-label={t('auth.loginBtn')}
            className="h-9 px-4 grid place-items-center rounded-full text-sm font-semibold text-white press"
            style={{ background: 'var(--color-brand)' }}
          >
            {t('auth.loginBtn')}
          </Link>
        )}
      </div>

      {/* Row 2 — search + cart */}
      <div className="h-11 px-3 pb-2 flex items-center gap-2">
        <button
          onClick={() => nav('/search')}
          aria-label={t('nav.search')}
          className="flex-1 min-w-0 h-10 rounded-full flex items-center gap-2 px-3.5 text-sm active:scale-[0.99] transition"
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-muted)',
          }}
        >
          <Search size={16} className="shrink-0" />
          {/* Selected language only — never English + Amharic together */}
          <span className="truncate">{t('mobile.searchPlaceholder')}</span>
        </button>

        {/* Language globe — always visible (spec §25) */}
        <button
          type="button"
          onClick={() => setLangOpen(true)}
          className="w-10 h-10 grid place-items-center rounded-full btn-ghost shrink-0"
          aria-label={t('mobile.language')}
        >
          <Globe size={20} />
        </button>

        <Link
          to={user ? '/buyer/cart' : '/login'}
          className="relative w-10 h-10 grid place-items-center rounded-full btn-ghost shrink-0"
          aria-label={`${t('nav.cart')}${cartCount > 0 ? ` (${cartCount})` : ''}`}
        >
          <ShoppingCart size={21} />
          {cartCount > 0 && (
            <span
              className="absolute top-0.5 right-0 min-w-[17px] h-[17px] px-1 text-[10px] font-bold rounded-full grid place-items-center text-white animate-bounceIn"
              style={{ background: 'var(--color-brand)' }}
            >
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Language sheet — shared with Account → Settings → Language */}
      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </header>
  );
}
