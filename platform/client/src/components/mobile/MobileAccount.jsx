import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight, ClipboardList, Heart, Globe, CircleHelp, Info,
  LogOut, LogIn, UserPlus, Store, Package, LayoutGrid, Bell, MapPin,
  Coins, UserRound, ShieldCheck, Lock,
} from 'lucide-react';
import { api } from '../../api/client.js';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/auth.js';
import { useWishlist } from '../../store/wishlist.js';
import { useCurrency } from '../../store/currency.js';
import Logo from '../Logo.jsx';
import LanguageSheet from './LanguageSheet.jsx';
import CurrencySheet from './CurrencySheet.jsx';
import ProfileSheet from './ProfileSheet.jsx';
import SecuritySheet from './SecuritySheet.jsx';

function Row({ to, onClick, icon: Icon, label, value, danger }) {
  const inner = (
    <>
      <span className="flex items-center gap-3 min-w-0">
        <Icon size={19} style={{ color: danger ? 'var(--color-flash)' : 'var(--color-muted)' }} />
        <span className="text-[15px] font-medium truncate" style={{ color: danger ? 'var(--color-flash)' : 'var(--color-text)' }}>
          {label}
        </span>
      </span>
      <span className="flex items-center gap-1 shrink-0" style={{ color: 'var(--color-muted)' }}>
        {value && <span className="text-xs">{value}</span>}
        <ChevronRight size={16} />
      </span>
    </>
  );
  const cls = 'w-full flex items-center justify-between py-3.5 min-h-[48px] active:bg-black/[0.03]';
  const style = { borderBottom: '1px solid var(--color-border)' };
  if (to) return <Link to={to} className={cls} style={style}>{inner}</Link>;
  return <button onClick={onClick} className={cls} style={style}>{inner}</button>;
}

const LANG_NAMES = { en: 'English', am: 'አማርኛ', or: 'Afaan Oromoo', ti: 'ትግርኛ', so: 'Af Soomaali' };

const Card = ({ title, children }) => (
  <div className="mt-3 mx-3 card px-4">
    {title && (
      <div className="pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
        {title}
      </div>
    )}
    {children}
  </div>
);

/**
 * Dedicated Account screen (replaces the big homepage login block).
 * Spec §27 structure:
 *   ACCOUNT  — Profile / Orders / Wishlist / Addresses / Notifications
 *   SETTINGS — Language / Currency / Notification preferences / Privacy / Security
 *   SUPPORT  — Help / About / Sign out
 * Every row is backed by a real destination or a real API call — no stubs.
 */
export default function MobileAccount() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, logout, cart } = useAuth();
  const clearWish = useWishlist((s) => s.clear);
  const currency = useCurrency((s) => s.current);
  const [langOpen, setLangOpen] = useState(false);
  const [curOpen, setCurOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Real unread badge (Phase 7) — server count only, no local fakes.
  useEffect(() => {
    if (!user) return setUnread(0);
    let alive = true;
    api.get('/notifications/unread-count')
      .then(({ data }) => { if (alive) setUnread(data.unreadCount || 0); })
      .catch(() => { });
    return () => { alive = false; };
  }, [user]);

  const onLogout = () => {
    logout();
    clearWish();
    toast.success(t('nav.logout'));
    nav('/');
  };

  const activeLang = LANG_NAMES[(localStorage.getItem('weynshop:lang') || 'en').slice(0, 2)] || 'English';
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div className="pb-6">
      {/* ── Profile header (tap to edit when signed in) ── */}
      <button
        type="button"
        onClick={user ? () => setProfileOpen(true) : undefined}
        className="w-full text-left px-4 pt-5 pb-5 flex items-center gap-3.5"
        style={{ background: 'linear-gradient(135deg, rgba(236,92,44,0.10), rgba(245,166,35,0.08))' }}
      >
        {user ? (
          <>
            <div className="w-14 h-14 rounded-full grid place-items-center text-xl font-extrabold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}
              aria-hidden="true">
              {(user.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-lg leading-tight truncate">{user.name}</div>
              <div className="text-sm truncate" style={{ color: 'var(--color-muted)' }}>{user.email}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-brand)' }}>
                {t('settings.editProfile')}
              </div>
            </div>
          </>
        ) : (
          <>
            <Logo iconOnly height={44} />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-lg">{t('mobile.greeting')}</div>
              <div className="text-xs line-clamp-2" style={{ color: 'var(--color-muted)' }}>{t('mobile.signInToShop')}</div>
            </div>
          </>
        )}
      </button>

      {/* ── Guest CTAs ── */}
      {!user && (
        <div className="px-4 pt-4 flex gap-3">
          <Link to="/login" className="btn-primary flex-1 h-11 rounded-full font-semibold">
            <LogIn size={17} /> {t('nav.login')}
          </Link>
          <Link to="/register" className="btn-secondary flex-1 h-11 rounded-full font-semibold">
            <UserPlus size={17} /> {t('nav.signup')}
          </Link>
        </div>
      )}

      {/* ── ACCOUNT (spec §27) ── */}
      {user && (
        <Card title={t('mobile.myAccount')}>
          <Row onClick={() => setProfileOpen(true)} icon={UserRound} label={t('settings.profile')} />
          {user?.role === 'buyer' && (
            <>
              <Row to="/buyer/orders" icon={ClipboardList} label={t('nav.orders')} />
              <Row to="/buyer/cart" icon={Package} label={t('nav.cart')} value={cartCount > 0 ? String(cartCount) : ''} />
            </>
          )}
          <Row to="/wishlist" icon={Heart} label={t('nav.wishlist')} />
          <Row to="/account/addresses" icon={MapPin} label={t('addr.title')} value={user?.defaultAddress ? t('addr.saved') : ''} />
          <Row to="/account/notifications" icon={Bell} label={t('notif.title')} value={unread > 0 ? String(unread) : ''} />
          {/* Seller / delivery / admin portal shortcut */}
          {user.role && user.role !== 'buyer' && (
            <Row to={`/${user.role}`} icon={Store} label={`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} portal`} />
          )}
        </Card>
      )}

      {/* Guest shopping shortcuts (same destinations as the buyer list) */}
      {!user && (
        <Card>
          <Row to="/wishlist" icon={Heart} label={t('nav.wishlist')} />
          <Row to="/deals" icon={LayoutGrid} label={t('nav.deals')} />
        </Card>
      )}

      {/* ── SETTINGS (spec §27) ── */}
      <Card title={t('settings.title')}>
        <Row onClick={() => setLangOpen(true)} icon={Globe} label={t('mobile.language')} value={activeLang} />
        <Row onClick={() => setCurOpen(true)} icon={Coins} label={t('settings.currency')} value={currency} />
        <Row to="/account/notifications" icon={Bell} label={t('settings.notifications')} value={unread > 0 ? String(unread) : ''} />
        <Row to="/privacy" icon={Lock} label={t('settings.privacy')} />
        <Row onClick={() => setSecurityOpen(true)} icon={ShieldCheck} label={t('settings.security')} />
      </Card>

      {/* ── SUPPORT ── */}
      <Card>
        <Row to="/faq" icon={CircleHelp} label={t('mobile.help')} />
        <Row to="/about" icon={Info} label={t('mobile.aboutWeyni')} />
      </Card>

      {/* ── Logout ── */}
      {user && (
        <div className="mt-4 px-3">
          <button onClick={onLogout}
            className="btn-secondary w-full h-11 rounded-full font-semibold text-danger-500"
            style={{ borderColor: 'var(--color-border)' }}>
            <LogOut size={17} /> {t('nav.logout')}
          </button>
        </div>
      )}

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
      <CurrencySheet open={curOpen} onClose={() => setCurOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
      <SecuritySheet open={securityOpen} onClose={() => setSecurityOpen(false)} />
    </div>
  );
}
