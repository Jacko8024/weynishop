import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ShoppingBag, Store, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/auth.js';
import { DEFAULT_COUNTRY, isValidLocalPhone, toE164 } from '../../lib/countries.js';
import PhoneInput from '../../components/PhoneInput.jsx';
import GoogleSignInButton from '../../components/GoogleSignInButton.jsx';
import AnimatedCharacters from '../../components/AnimatedCharacters.jsx';
import Logo from '../../components/Logo.jsx';

/**
 * Simplified mobile-first sign-in.
 * Phone (+251) is the primary identifier; email remains an alternative.
 * One primary action, no explanatory paragraphs. Desktop keeps the
 * branded left panel; the form itself is shared.
 */
export default function Login() {
  const { t } = useTranslation();
  const { login, loginWithPhone } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get('redirect') || '';
  const afterLogin = redirect.startsWith('/') ? redirect : null;
  const [mode, setMode] = useState('phone'); // 'phone' | 'email'
  const [role, setRole] = useState('buyer'); // role for NEW Google users
  const [form, setForm] = useState({
    phone: '',              // local digits (no dial code)
    phoneCountry: DEFAULT_COUNTRY, // ET by default; user can switch to SA
    email: '',
    password: '',
  });
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [typing, setTyping] = useState(false);

  const next = (user) => {
    if (user.status === 'pending') return '/pending-approval';
    return afterLogin || `/${user.role}`;
  };

  // Remember the intended destination before the app loses focus during the
  // Google redirect flow (native). The deep-link completion reads this to
  // land the user on the right screen even after a cold relaunch (Case C).
  useEffect(() => {
    if (afterLogin) {
      try { localStorage.setItem('weynshop:loginRedirect', afterLogin); } catch { /* ignore */ }
    }
  }, [afterLogin]);

  const submit = async (e) => {
    e.preventDefault();
    if (mode === 'phone' && !isValidLocalPhone(form.phone, form.phoneCountry)) {
      setPhoneError(t('auth.invalidPhone'));
      return;
    }
    setLoading(true);
    try {
      const user = mode === 'phone'
        ? await loginWithPhone(toE164(form.phone, form.phoneCountry), form.password)
        : await login(form.email, form.password);
      if (user.status === 'rejected') {
        toast.error('Your account was rejected. Contact support for details.');
        return;
      }
      toast.success(`${t('auth.welcomeBack')} ${user.name}`);
      nav(next(user), { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setPhoneError('');
  };


  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left — animated characters (desktop only) */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #FF8A4C 0%, #EC5C2C 50%, #B83E1A 100%)' }}>
        <Link to="/" className="relative z-20 inline-flex items-center gap-2" aria-label="WeyniShopping home">
          <Logo inverse height={40} />
        </Link>

        <div className="relative z-20 flex items-end justify-center">
          <AnimatedCharacters
            typing={typing}
            hasPassword={form.password.length > 0}
            showPassword={showPassword}
          />
        </div>

        <div className="relative z-20 flex items-center gap-6 text-sm text-white/70">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center mb-8" aria-label="WeyniShopping home">
            <Logo height={40} />
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5 font-localized">
              {t('auth.welcomeBack')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('auth.loginPrompt')}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'phone' ? (
              <div>
                <label className="label" htmlFor="phone">{t('auth.phoneLabel')}</label>
                {/* Country-aware phone input — ET (+251) / SA (+966) selector,
                    numeric keyboard, dial code can never be typed twice.
                    Config lives in lib/countries.js (single source). */}
                <PhoneInput
                  value={form.phone}
                  country={form.phoneCountry}
                  error={phoneError}
                  onChange={({ country, local }) => {
                    setForm((f) => ({ ...f, phone: local, phoneCountry: country }));
                    setPhoneError('');
                  }}
                  onFocus={() => setTyping(true)}
                  onBlur={() => setTyping(false)}
                />
                {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="email">{t('auth.email')}</label>
                <input
                  id="email"
                  className="input h-12"
                  type="email"
                  required
                  value={form.email}
                  placeholder="you@example.com"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setTyping(true)}
                  onBlur={() => setTyping(false)}
                  autoComplete="email"
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="password">{t('auth.password')}</label>
              <div className="relative">
                <input
                  id="password"
                  className="input h-12 pr-12"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  placeholder="••••••••"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setTyping(true)}
                  onBlur={() => setTyping(false)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button className="btn-primary w-full h-12 text-base mt-1" disabled={loading}>
              {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
            </button>
          </form>

          {/* Switch identifier: phone ⇄ email */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => switchMode(mode === 'phone' ? 'email' : 'phone')}
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--color-brand)' }}
            >
              {mode === 'phone' ? t('auth.useEmail') : t('auth.usePhone')}
            </button>
          </div>

          <div className="flex items-center gap-3 my-6 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" />
            OR
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <GoogleSignInButton
            role={role}
            onSuccess={(user) => {
              toast.success(`${t('auth.welcomeBack')} ${user.name}`);
              nav(next(user), { replace: true });
            }}
          />

          {/* Role for NEW Google accounts (existing accounts keep their
              role server-side — the backend ignores this when the user
              already exists). Three simple buttons, no multi-step UI. */}
          <div className="mt-6">
            <p className="text-xs text-center mb-2.5 font-medium" style={{ color: 'var(--color-muted)' }}>
              {t('auth.iAmA')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'buyer', icon: ShoppingBag, key: 'auth.buyer' },
                { value: 'seller', icon: Store, key: 'auth.seller' },
                { value: 'delivery', icon: Truck, key: 'auth.delivery' },
              ].map(({ value, icon: Icon, key }) => {
                const active = role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    aria-pressed={active}
                    className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-1 text-xs font-semibold transition-colors"
                    style={{
                      background: active ? 'rgba(236,92,44,0.08)' : 'var(--color-surface)',
                      border: `1.5px solid ${active ? 'var(--color-brand)' : 'var(--color-border)'}`,
                      color: active ? 'var(--color-brand)' : 'var(--color-text)',
                    }}
                  >
                    <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                    {t(key)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center text-sm mt-8" style={{ color: 'var(--color-muted)' }}>
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: 'var(--color-brand)' }}>
              {t('auth.signupBtn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
