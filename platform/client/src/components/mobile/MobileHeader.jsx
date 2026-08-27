import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingCart, Globe } from 'lucide-react';
import { useAuth } from '../../store/auth.js';
import Logo from '../Logo.jsx';
import LanguageSheet from './LanguageSheet.jsx';

/**
 * Compact mobile shopping header.
 * [logo] [ search pill ] [language] [cart]
 * The search pill is a fake input that opens the dedicated search screen,
 * keeping the home screen clean while making search one tap away.
 * The globe opens the language sheet so switching language is obvious.
 */
export default function MobileHeader() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, cart } = useAuth();
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 safe-top nav-blur" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="h-12 px-3 flex items-center gap-2.5">
        {/* Logo */}
        <Link to="/" aria-label="WeyniShopping home" className="shrink-0 flex">
          <Logo iconOnly height={30} />
        </Link>

        {/* Search pill */}
        <button
          onClick={() => nav('/search')}
          aria-label={t('nav.search')}
          className="flex-1 min-w-0 h-9 rounded-full flex items-center gap-2 px-3 text-sm active:scale-[0.99] transition"
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-muted)',
          }}
        >
          <Search size={16} shrink-0 />
          <span className="truncate">{t('nav.search')}</span>
        </button>

        {/* Language switcher */}
        <button
          onClick={() => setLangOpen(true)}
          className="w-10 h-10 grid place-items-center rounded-full btn-ghost shrink-0"
          aria-label={t('mobile.language')}
        >
          <Globe size={20} />
        </button>

        {/* Cart */}
        <Link
          to={user ? '/buyer/cart' : '/login'}
          className="relative w-10 h-10 grid place-items-center rounded-full btn-ghost"
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

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </header>
  );
}
