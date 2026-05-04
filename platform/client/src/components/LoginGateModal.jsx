import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { X, LogIn, UserPlus } from 'lucide-react';
import { useLoginGate } from '../store/loginGate.js';

export default function LoginGateModal() {
  const { t } = useTranslation();
  const { visible, close } = useLoginGate();
  const nav = useNavigate();

  if (!visible) return null;

  const go = (path) => { close(); nav(path); };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] grid place-items-center p-4 animate-fadeIn"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-bounceIn"
        style={{ background: 'var(--color-surface)' }}
      >
        <button onClick={close} className="absolute top-3 right-3 btn-ghost p-1.5" aria-label="Close">
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <div
            className="w-16 h-16 rounded-2xl grid place-items-center mb-4 text-white text-3xl font-black"
            style={{ background: 'var(--color-brand)' }}
          >
            W
          </div>
          <h2 className="text-xl font-bold">{t('auth.loginPrompt')}</h2>
          <p className="text-sm mt-1.5" style={{ color: 'var(--color-muted)' }}>
            {t('auth.loginSubtitle')}
          </p>
        </div>

        <div className="space-y-2.5 mt-2">
          <button onClick={() => go('/login')} className="btn-primary w-full text-base py-2.5">
            <LogIn size={18} /> {t('auth.loginBtn')}
          </button>
          <button onClick={() => go('/register')} className="btn-secondary w-full text-base py-2.5">
            <UserPlus size={18} /> {t('auth.signupBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
