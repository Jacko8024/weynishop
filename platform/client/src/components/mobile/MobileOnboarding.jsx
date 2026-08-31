import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Store, Truck, Check, LogIn, UserPlus } from 'lucide-react';
import Logo from '../Logo.jsx';
import { SUPPORTED_LANGS } from '../../lib/i18n.js';
import { isNativeApp } from '../../lib/platform.js';

export const ONBOARDED_KEY = 'weynshop:onboarded';

const ROLES = [
  { value: 'buyer', icon: ShoppingBag, titleKey: 'auth.buyer', descKey: 'auth.buyerDesc' },
  { value: 'seller', icon: Store, titleKey: 'auth.seller', descKey: 'auth.sellerDesc' },
  { value: 'delivery', icon: Truck, titleKey: 'auth.delivery', descKey: 'auth.deliveryDesc' },
];

/**
 * First-launch mobile onboarding: Language → I am a… → Sign in / Sign up.
 * Shown once (persisted via ONBOARDED_KEY) and skipped entirely for
 * authenticated users. Uses the existing i18n system — the selected
 * language is applied live and cached by i18next.
 */
export default function MobileOnboarding({ onDone }) {
  const { t, i18n } = useTranslation();
  const nav = useNavigate();

  // SELF-GATING (defense in depth): even if some future caller imports and
  // renders this component on the website, it renders NOTHING there. The
  // onboarding intro is native-app-only by spec — detection is real
  // Capacitor platform presence, never window.innerWidth.
  if (!isNativeApp()) return null;

  return <OnboardingSteps onDone={onDone} t={t} i18n={i18n} nav={nav} />;
}

function OnboardingSteps({ onDone, t, i18n, nav }) {
  const [step, setStep] = useState('lang');
  const [lang, setLang] = useState(() => (i18n.language || 'am').slice(0, 2));
  const [role, setRole] = useState('buyer');

  const finish = () => {
    try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch { /* ignore */ }
    onDone?.();
  };

  const pickLang = (code) => {
    setLang(code);
    i18n.changeLanguage(code); // persisted by i18next detector cache
  };

  const goLogin = () => { finish(); nav('/login'); };
  const goRegister = () => { finish(); nav(`/register?role=${role}`); };
  const goBrowse = () => { finish(); nav('/'); };

  const primary = 'var(--color-brand)';
  const mainLang = SUPPORTED_LANGS.find((l) => l.code === 'am');
  const otherLangs = SUPPORTED_LANGS.filter((l) => l.code !== 'am');

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" style={{ background: 'var(--color-bg)' }}>
      <div className="min-h-full flex flex-col px-5 pt-[calc(24px+env(safe-area-inset-top,0px))] pb-[calc(24px+env(safe-area-inset-bottom,0px))] max-w-md mx-auto">

        {/* ── STEP 1 · LANGUAGE ── */}
        {step === 'lang' && (
          <div className="flex flex-col flex-1">
            <div className="flex flex-col items-center text-center pt-8 pb-8">
              <Logo height={40} />
              <h1 className="text-2xl font-extrabold mt-5 font-localized">
                {t('onboarding.welcome', { name: t('brand.name') })}
              </h1>
              <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
                {t('onboarding.chooseLanguage')}
              </p>
            </div>

            <div className="space-y-3">
              {/* Amharic — recommended default */}
              <button
                onClick={() => pickLang(mainLang.code)}
                aria-pressed={lang === mainLang.code}
                className="w-full flex items-center justify-between rounded-2xl px-4 py-4 press"
                style={{
                  background: 'var(--color-surface)',
                  border: `2px solid ${lang === mainLang.code ? primary : 'var(--color-border)'}`,
                }}
              >
                <span className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full grid place-items-center text-lg font-bold text-white"
                    style={{ background: primary }}>አ</span>
                  <span className="text-left">
                    <span className="block text-base font-bold">{mainLang.native}</span>
                    <span className="block text-[11px]" style={{ color: 'var(--color-brand)' }}>
                      {t('onboarding.recommended')}
                    </span>
                  </span>
                </span>
                {lang === mainLang.code && <Check size={20} style={{ color: primary }} />}
              </button>

              {/* English + remaining supported languages */}
              {otherLangs.map((l) => (
                <button
                  key={l.code}
                  onClick={() => pickLang(l.code)}
                  aria-pressed={lang === l.code}
                  className="w-full flex items-center justify-between rounded-2xl px-4 py-3.5 press"
                  style={{
                    background: 'var(--color-surface)',
                    border: `2px solid ${lang === l.code ? primary : 'var(--color-border)'}`,
                  }}
                >
                  <span className="text-base font-semibold">{l.native}</span>
                  {lang === l.code && <Check size={20} style={{ color: primary }} />}
                </button>
              ))}
            </div>

            <button onClick={() => setStep('role')} className="btn-primary w-full h-12 rounded-full text-base font-bold mt-8">
              {t('onboarding.continue')}
            </button>
          </div>
        )}

        {/* ── STEP 2 · I AM A… ── */}
        {step === 'role' && (
          <div className="flex flex-col flex-1">
            <div className="text-center pt-8 pb-6">
              <h1 className="text-2xl font-extrabold font-localized">{t('auth.iAmA')}</h1>
            </div>

            <div className="space-y-3">
              {ROLES.map(({ value, icon: Icon, titleKey, descKey }) => {
                const active = role === value;
                return (
                  <button
                    key={value}
                    onClick={() => setRole(value)}
                    aria-pressed={active}
                    className="w-full flex items-center gap-3.5 rounded-2xl px-4 py-4 text-left press"
                    style={{
                      background: 'var(--color-surface)',
                      border: `2px solid ${active ? primary : 'var(--color-border)'}`,
                    }}
                  >
                    <span className="w-12 h-12 rounded-xl grid place-items-center shrink-0 text-white"
                      style={{ background: active ? primary : 'var(--color-muted)' }}>
                      <Icon size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-bold">{t(titleKey)}</span>
                      <span className="block text-[13px] mt-0.5 leading-snug" style={{ color: 'var(--color-muted)' }}>
                        {t(descKey)}
                      </span>
                    </span>
                    {active && <Check size={20} className="shrink-0" style={{ color: primary }} />}
                  </button>
                );
              })}
            </div>

            <button onClick={() => setStep('auth')} className="btn-primary w-full h-12 rounded-full text-base font-bold mt-8">
              {t('onboarding.continue')}
            </button>
          </div>
        )}

        {/* ── STEP 3 · SIGN IN / SIGN UP ── */}
        {step === 'auth' && (
          <div className="flex flex-col flex-1">
            <div className="flex flex-col items-center text-center pt-10 pb-8">
              <Logo height={40} />
              <h1 className="text-2xl font-extrabold mt-5 font-localized">{t('onboarding.authTitle')}</h1>
              <p className="text-sm mt-2" style={{ color: 'var(--color-muted)' }}>
                {t('onboarding.authSub')}
              </p>
            </div>

            <div className="space-y-3 mt-2">
              <button onClick={goLogin} className="btn-primary w-full h-12 rounded-full text-base font-bold">
                <LogIn size={18} /> {t('auth.loginBtn')}
              </button>
              <button onClick={goRegister} className="btn-secondary w-full h-12 rounded-full text-base font-bold">
                <UserPlus size={18} /> {t('auth.signupBtn')}
              </button>
            </div>

            {role === 'buyer' && (
              <button onClick={goBrowse} className="text-sm font-medium mt-6 mx-auto underline underline-offset-4"
                style={{ color: 'var(--color-muted)' }}>
                {t('onboarding.browseFirst')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

