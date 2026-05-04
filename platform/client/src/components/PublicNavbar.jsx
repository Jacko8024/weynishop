import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, ShoppingCart, Heart, User as UserIcon, Menu, X,
  ClipboardList, LogOut, Store, Zap,
} from 'lucide-react';
import { useAuth } from '../store/auth.js';
import LangSwitcher from './LangSwitcher.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import Logo from './Logo.jsx';

export default function PublicNavbar() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, cart, logout } = useAuth();
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [q, setQ] = useState('');
  const accountRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onDoc = (e) => { if (!accountRef.current?.contains(e.target)) setAccountOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const portalLink = user ? `/${user.role}` : null;

  return (
    <header
      className={`sticky top-0 z-40 transition-shadow ${scrolled ? 'shadow-sm nav-blur' : ''}`}
      style={{
        background: scrolled ? undefined : 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="max-w-page mx-auto h-[60px] px-4 flex items-center gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0" aria-label="WeyniShop home">
          <Logo iconOnly className="sm:hidden" height={36} />
          <Logo className="hidden sm:block" height={32} />
        </Link>

        {/* Search bar — full width */}
        <form onSubmit={submitSearch} className="flex-1 max-w-2xl">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--color-muted)' }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('nav.search')}
              className="input pl-9 h-10 rounded-full"
            />
          </div>
        </form>

        {/* Desktop right cluster */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/deals" className="btn-ghost text-sm gap-1.5">
            <Zap size={16} className="text-flash" /> {t('nav.deals')}
          <ThemeToggle />
          </Link>
          <LangSwitcher />

          {!user ? (
            <>
              <Link to="/login" className="btn-ghost text-sm">{t('nav.login')}</Link>
              <Link to="/register" className="btn-primary text-sm">{t('nav.signup')}</Link>
            </>
          ) : (
            <div className="relative" ref={accountRef}>
              <button onClick={() => setAccountOpen((o) => !o)} className="btn-ghost text-sm gap-1.5">
                <UserIcon size={16} />
                <span className="font-medium max-w-[120px] truncate">{user.name}</span>
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg border z-50 overflow-hidden animate-fadeIn"
                     style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="font-semibold truncate">{user.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{user.email}</div>
                  </div>
                  {portalLink && (
                    <Link to={portalLink} onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--color-bg)]">
                      <Store size={15} /> {user.role === 'buyer' ? t('nav.account') : t(`auth.${user.role}`)}
                    </Link>
                  )}
                  {user.role === 'buyer' && (
                    <>
                      <Link to="/buyer/orders" onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--color-bg)]">
                        <ClipboardList size={15} /> {t('nav.orders')}
                      </Link>
                      <Link to="/wishlist" onClick={() => setAccountOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--color-bg)]">
                        <Heart size={15} /> {t('nav.wishlist')}
                      </Link>
                    </>
                  )}
                  <button onClick={() => { logout(); setAccountOpen(false); nav('/'); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-[var(--color-bg)] border-t"
                          style={{ borderColor: 'var(--color-border)' }}>
                    <LogOut size={15} /> {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          )}

          <Link to={user ? '/buyer/cart' : '/login'} className="btn-ghost relative" aria-label="Cart">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full grid place-items-center text-white"
                    style={{ background: 'var(--color-brand)' }}>
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden btn-ghost p-2" onClick={() => setMenuOpen((o) => !o)}
                aria-label="Menu">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t animate-fadeIn px-4 py-3 space-y-2"
             style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-end">
            <Link to={user ? '/buyer/cart' : '/login'} className="btn-ghost relative" onClick={() => setMenuOpen(false)}>
              <ShoppingCart size={18} /> {t('nav.cart')}
              {cartCount > 0 && <span className="ml-1 text-xs font-bold text-brand-600">({cartCount})</span>}
            </Link>
          </div>
          <div className="pt-1 pb-2 border-b border-slate-200">
            <LangSwitcher inline />
          </div>
          <Link to="/deals" onClick={() => setMenuOpen(false)} className="block btn-ghost w-full justify-start text-sm">
            <Zap size={16} className="text-flash" /> {t('nav.deals')}
          </Link>
          {!user ? (
            <div className="flex gap-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1">{t('nav.login')}</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1">{t('nav.signup')}</Link>
            </div>
          ) : (
            <>
              {portalLink && (
                <Link to={portalLink} onClick={() => setMenuOpen(false)}
                      className="block btn-ghost w-full justify-start text-sm">
                  <Store size={16} /> {user.role === 'buyer' ? t('nav.account') : t(`auth.${user.role}`)}
                </Link>
              )}
              {user.role === 'buyer' && (
                <>
                  <Link to="/buyer/orders" onClick={() => setMenuOpen(false)}
                        className="block btn-ghost w-full justify-start text-sm">
                    <ClipboardList size={16} /> {t('nav.orders')}
                  </Link>
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)}
                        className="block btn-ghost w-full justify-start text-sm">
                    <Heart size={16} /> {t('nav.wishlist')}
                  </Link>
                </>
              )}
              <button onClick={() => { logout(); setMenuOpen(false); nav('/'); }}
                      className="w-full btn-ghost justify-start text-sm">
                <LogOut size={16} /> {t('nav.logout')}
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
