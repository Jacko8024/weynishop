import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/auth.js';
import { isValidEthPhone, toE164EthPhone, formatEthPhoneLocal, ETH_DIAL_CODE } from '../../lib/phone.js';
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
  const [form, setForm] = useState({ phone: '', email: '', password: '' });
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [typing, setTyping] = useState(false);

  const next = (user) => {
    if (user.status === 'pending') return '/pending-approval';
    return afterLogin || `/${user.role}`;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (mode === 'phone' && !isValidEthPhone(form.phone)) {
      setPhoneError(t('auth.invalidPhone'));
      return;
    }
    setLoading(true);
    try {
      const user = mode === 'phone'
        ? await loginWithPhone(toE164EthPhone(form.phone), form.password)
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
                {/* Ethiopian phone input — fixed +251 prefix, numeric keyboard */}
                <div
                  className={`flex items-stretch overflow-hidden rounded-lg focus-within:ring-2 ${phoneError ? 'border-red-300' : ''}`}
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)', '--tw-ring-color': 'var(--color-brand)' }}
                >
                  <span
                    className="flex items-center gap-1.5 px-3 text-sm font-semibold select-none shrink-0"
                    style={{ borderRight: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
                    aria-hidden="true"
                  >
                    🇪🇹 {ETH_DIAL_CODE}
                  </span>
                  <input
                    id="phone"
                    className="flex-1 min-w-0 h-12 px-3 text-base tracking-wide focus:outline-none"
                    style={{ background: 'transparent', color: 'var(--color-text)' }}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="9XX XXX XXX"
                    value={formatEthPhoneLocal(form.phone)}
                    onChange={(e) => {
                      // digits only — the +251 prefix is fixed, so it can
                      // never be typed twice
                      setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 12) });
                      setPhoneError('');
                    }}
                    onFocus={() => setTyping(true)}
                    onBlur={() => setTyping(false)}
                  />
                </div>
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
            onSuccess={(user) => {
              toast.success(`${t('auth.welcomeBack')} ${user.name}`);
              nav(next(user), { replace: true });
            }}
          />

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
