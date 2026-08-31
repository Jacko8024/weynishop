import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../store/auth.js';

/**
 * "Continue with Google" button. On success, calls `onSuccess(user)`.
 * If `role` is provided and the user is new, the server registers them with
 * that role; for existing accounts the stored role is preserved.
 *
 * Native app: Google's native account chooser (Credential Manager) returns
 * the ID token directly to the app — no browser involved, the promise
 * resolves in-app (see lib/firebase.js).
 * Website: unchanged popup flow.
 */
export default function GoogleSignInButton({ role, onSuccess, label }) {
  const { t } = useTranslation();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const user = await loginWithGoogle(role);
      onSuccess?.(user);
    } catch (err) {
      const code = err?.code || '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'access_denied' ||
        code === 'auth/user-cancelled' ||
        code === 'CANCELLED'        // native chooser dismissed (Credential Manager)
      ) {
        // User dismissed / cancelled — quiet return to the login screen.
        return;
      }
      if (code === 'NO_CREDENTIALS') {
        // NOT a quiet cancel: on a device with a Google account this almost
        // always means Credential Manager REJECTED our app (missing Android
        // OAuth client / SHA-1 in Firebase) — ApiException 10 arrives
        // wrapped as NoCredentialException. Silent swallowing here was the
        // "button does nothing" bug.
        setFailed(true);
        toast.error(t('auth.googleNotSetup'));
        console.error('[GoogleSignIn] NO_CREDENTIALS — register com.weynishop.app in Firebase with its SHA-1 fingerprint (see MOBILE_SETUP.md)');
        return;
      }
      setFailed(true);
      toast.error(t('auth.googleFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.3-7.2 2.3-5.2 0-9.6-3.3-11.2-8L6.2 33C9.6 39.4 16.3 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C41.3 35.7 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {loading ? t('auth.googleWorking') : label || t('auth.continueWithGoogle')}
      </button>
      {failed && (
        <div className="mt-2 text-center">
          <p className="text-xs" style={{ color: 'var(--color-flash)' }}>{t('auth.googleFailed')}</p>
          <button type="button" onClick={start} className="text-xs font-semibold underline underline-offset-2 mt-1" style={{ color: 'var(--color-brand)' }}>
            {t('common.retry')}
          </button>
        </div>
      )}
    </div>
  );
}
