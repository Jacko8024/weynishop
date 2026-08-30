import { Capacitor } from '@capacitor/core';

// App plugin handle.
//
// The 'App' plugin (appUrlOpen / backButton / lifecycle) is provided by
// the @capacitor/app npm package, which brings its own native bridge.
// We resolve it through the plugin registry instead of a static import
// so the web bundle builds even before `npm i @capacitor/app` has been
// run. REQUIRED before the next APK build (see MOBILE_SETUP.md):
//   npm install @capacitor/app
//   npx cap sync android
// On web this module's installDeepLinkHandler() never runs, and
// registerPlugin returns an inert proxy either way.
const App = Capacitor.registerPlugin('App', {
    web: () => ({
        addListener: () => Promise.resolve({ remove: async () => { } }),
        removeAllListeners: () => Promise.resolve(),
    }),
});
import i18n from './i18n.js';
import {
    finishGoogleSignIn,
    resolvePendingGoogleSignIn,
    rejectPendingGoogleSignIn,
    takeStashedGoogleRole,
} from './firebase.js';

/**
 * Google sign-in completion (native mobile only).
 *
 * PRIMARY PATH — in-WebView redirect (see lib/firebase.js): the WebView
 * navigates to accounts.google.com and back to https://localhost/<route>;
 * the SPA reboots and finishBootGoogleRedirect() below resolves the
 * credential via getRedirectResult(), exchanges the idToken through the
 * auth store and navigates the user:
 *
 *   Case A (normal return):  app reloads on the Login route → boot finisher
 *                            completes login → navigate to destination.
 *   Case B (user cancels):   the return URL carries an error
 *                            (access_denied) → friendly message, NO
 *                            navigation.
 *
 * FALLBACK PATH — appUrlOpen deep links (com.weynishop.app://auth/callback):
 * kept for completeness; only exact scheme + path matches are processed and
 * arbitrary URLs are ignored (callback validation).
 */

const AUTH_SCHEME = 'com.weynishop.app';
const AUTH_PATHS = ['/auth/callback', '/__/auth/handler'];

let installed = false;
let routerRef = null;
let authStoreRef = null;      // useAuth store (set after store init)
let onFinishedRef = null;     // optional UI hook (toast etc.)

export const setDeepLinkRouter = (r) => { routerRef = r; };
export const setDeepLinkAuthStore = (s) => { authStoreRef = s; };
export const setDeepLinkNotifier = (fn) => { onFinishedRef = fn; };

const notify = (kind, payload) => { try { onFinishedRef?.(kind, payload); } catch { /* UI optional */ } };

/** Extract a usable error code from a callback URL query string. */
const errorFromUrl = (url) => {
    try {
        const q = new URL(url).searchParams;
        return q.get('error') || q.get('errorCode') || '';
    } catch {
        return '';
    }
};

const isAuthCallback = (url) => {
    if (typeof url !== 'string') return false;
    if (!url.startsWith(`${AUTH_SCHEME}://`)) return false;
    try {
        const u = new URL(url);
        return AUTH_PATHS.some((p) => u.pathname === p || u.pathname.startsWith(`${p}/`));
    } catch {
        return false;
    }
};

/** Where should the user land after a successful login? */
const destinationFor = (user) => {
    if (!user) return '/';
    if (user.status === 'pending') return '/pending-approval';
    const saved = localStorage.getItem('weynshop:loginRedirect');
    if (saved) {
        localStorage.removeItem('weynshop:loginRedirect');
        if (saved.startsWith('/')) return saved;
    }
    return user.role ? `/${user.role}` : '/';
};

const completeLogin = async () => {
    // 1. Resolve the Firebase credential from the redirect.
    const result = await finishGoogleSignIn();
    if (result?.error) {
        // The redirect round-trip completed but failed (e.g. user
        // cancelled at the Google page) — notify, no navigation.
        rejectPendingGoogleSignIn(Object.assign(new Error(result.error), { code: result.error }));
        notify('error', { code: result.error });
        return true;
    }
    if (!result?.idToken) return false;

    // 2. Prefer the still-mounted Login screen (Cases A/B): it will store the
    //    session, stop its spinner and navigate itself.
    if (resolvePendingGoogleSignIn(result)) return true;

    // 3. No awaiting screen (page reloaded after the redirect, or cold
    //    relaunch): finish globally through the auth store, reusing the
    //    role stashed before the redirect left the app.
    if (authStoreRef?.getState) {
        const { loginWithGoogleFromIdToken } = authStoreRef.getState();
        if (typeof loginWithGoogleFromIdToken === 'function') {
            const user = await loginWithGoogleFromIdToken(result.idToken, takeStashedGoogleRole());
            const dest = destinationFor(user);
            notify('success', { user });
            if (routerRef?.navigate) routerRef.navigate(dest, { replace: true });
            else window.location.assign(dest);
            return true;
        }
    }
    return false;
};

export const installDeepLinkHandler = () => {
    if (installed || !Capacitor.isNativePlatform()) return;
    installed = true;

    // Cold-launch case: Android delivers the URL at startup as
    // appUrlOpen before React mounts in some versions — the same listener
    // below covers both (Capacitor queues the initial event).
    App.addListener('appUrlOpen', async ({ url }) => {
        if (!isAuthCallback(url)) return; // ignore non-auth deep links

        const errCode = errorFromUrl(url);
        if (errCode) {
            // Case D/E — cancelled (access_denied) or failed.
            // Wake the Login screen if alive, else just toast.
            rejectPendingGoogleSignIn(Object.assign(new Error(errCode), { code: errCode }));
            notify('error', { code: errCode });
            return;
        }

        try {
            const ok = await completeLogin();
            if (!ok) notify('error', { code: 'no-credential' });
        } catch (e) {
            notify('error', { code: e?.code || 'unknown' });
        }
    });
};

/**
 * Boot finisher for the in-WebView redirect flow (see firebase.js).
 * Called once from main.jsx on native. Silently does nothing on a normal
 * boot (no pending redirect). The store ref is already wired by main.jsx;
 * the router ref arrives when <App/> mounts — wait briefly for it.
 */
export const finishBootGoogleRedirect = async () => {
    if (!Capacitor.isNativePlatform()) return;

    // Case B — user cancelled at the Google page: the handler returns with
    // an error param in the query string or hash. Clean the URL and toast.
    let errCode = '';
    try {
        const q = new URLSearchParams(window.location.search);
        const h = window.location.hash.startsWith('#')
            ? new URLSearchParams(window.location.hash.slice(1))
            : null;
        errCode = q.get('error') || h?.get('error') || '';
    } catch { /* malformed URL — ignore */ }
    if (errCode) {
        try { window.history.replaceState({}, '', window.location.pathname); } catch { /* ok */ }
        rejectPendingGoogleSignIn(Object.assign(new Error(errCode), { code: errCode }));
        notify('error', { code: errCode });
        return;
    }

    // Wait (max ~5s) for the router ref — <App/> mounts right after this.
    for (let i = 0; i < 50 && !(authStoreRef && routerRef); i++) {
        await new Promise((r) => setTimeout(r, 100));
    }
    if (!(authStoreRef && routerRef)) return;

    try {
        await completeLogin(); // silent no-op when no redirect is pending
    } catch { /* already surfaced via completeLogin failure paths */ }
};

/** i18n-safe message for the UI hook (used by main.jsx). */
export const deepLinkErrorMessage = (code) => {
    const t = i18n.t.bind(i18n);
    if (code === 'access_denied' || code === 'auth/cancelled-popup-request' || code === 'popup-closed-by-user') {
        return t('auth.googleCancelled');
    }
    return t('auth.googleFailed');
};
