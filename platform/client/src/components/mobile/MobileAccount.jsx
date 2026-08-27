import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight, ClipboardList, Heart, Globe, CircleHelp, Info,
  LogOut, LogIn, UserPlus, Store, Package, LayoutGrid,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/auth.js';
import { useWishlist } from '../../store/wishlist.js';
import Logo from '../Logo.jsx';
import LanguageSheet from './LanguageSheet.jsx';

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

/**
 * Dedicated Account screen (replaces the big homepage login block).
 * Guests get a compact sign-in prompt; logged-in users get a
 * marketplace-style settings list. Language moved here per design spec.
 */
export default function MobileAccount() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, logout, cart } = useAuth();
  const clearWish = useWishlist((s) => s.clear);
  const [langOpen, setLangOpen] = useState(false);

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
      {/* ── Profile header ── */}
      <div className="px-4 pt-5 pb-5 flex items-center gap-3.5"
           style={{ background: 'linear-gradient(135deg, rgba(236,92,44,0.10), rgba(245,166,35,0.08))' }}>
        {user ? (
          <>
            <div className="w-14 h-14 rounded-full grid place-items-center text-xl font-extrabold text-white shrink-0"
                 style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}
                 aria-hidden="true">
              {(user.name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-lg leading-tight truncate">{user.name}</div>
              <div className="text-sm truncate" style={{ color: 'var(--color-muted)' }}>{user.email}</div>
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
      </div>

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

      {/* ── Shopping list ── */}
      <div className="mt-4 mx-3 card px-4">
        {user?.role === 'buyer' && (
          <>
            <Row to="/buyer/orders" icon={ClipboardList} label={t('nav.orders')} />
            <Row to="/wishlist" icon={Heart} label={t('nav.wishlist')} />
            <Row to="/buyer/cart" icon={Package} label={t('nav.cart')} value={cartCount > 0 ? String(cartCount) : ''} />
          </>
        )}
        {!user && (
          <>
            <Row to="/wishlist" icon={Heart} label={t('nav.wishlist')} />
            <Row to="/deals" icon={LayoutGrid} label={t('nav.deals')} />
          </>
        )}
        {/* Seller / delivery / admin portal shortcut */}
        {user && user.role && user.role !== 'buyer' && (
          <Row to={`/${user.role}`} icon={Store} label={`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} portal`} />
        )}
      </div>

      {/* ── Settings list ── */}
      <div className="mt-3 mx-3 card px-4">
        <Row onClick={() => setLangOpen(true)} icon={Globe} label={t('mobile.language')} value={activeLang} />
        <Row to="/faq" icon={CircleHelp} label={t('mobile.help')} />
        <Row to="/about" icon={Info} label={t('mobile.aboutWeyni')} />
      </div>

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
    </div>
  );
}

