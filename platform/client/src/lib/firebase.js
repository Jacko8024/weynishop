import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

// Public web config — safe to ship to the browser.
// Override any value with VITE_FIREBASE_* if you want per-env configs.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC9pHmRut5vIm0BUzz5RVXGsQbUA2Dv7Sw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'weynishop.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'weynishop',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'weynishop.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '700988913337',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:700988913337:web:eca95d910787a16d570d68',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-KVDBVZ91MD',
};

// Idempotent: HMR may re-evaluate this module.
const app = getApps()[0] || initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
firebaseAuth.useDeviceLanguage();

// ---------------------------------------------------------------------------
// Native mobile (Capacitor) Google sign-in
// ---------------------------------------------------------------------------
// The OAuth redirect_uri Firebase presents to Google is always
//   https://<authDomain>/__/auth/handler
// Google only accepts handler URLs of REAL, provisioned Firebase domains
// (weynishop.firebaseapp.com / weynishop.web.app) — a made-up subdomain such
// as com.weynishop.app.firebaseapp.com is never registered on the Google
// OAuth client and fails at accounts.google.com with redirect_uri_mismatch.
//
// Therefore the native app runs signInWithRedirect() INSIDE the app WebView
// with the SAME real authDomain as the website:
//
//   1. signInWithRedirect() navigates the WebView itself to
//      accounts.google.com; redirect_uri is the real handler Google already
//      trusts (this is why the website works).
//   2. The Firebase handler bounces back to the page that started the flow.
//      In Capacitor the app is served from https://localhost
//      (capacitor.config.json → androidScheme: "https"), and `localhost` is
//      a default Authorized domain in every Firebase project.
//   3. The SPA boots fresh on return; finishBootGoogleRedirect()
//      (lib/deeplink.js, called from main.jsx) resolves the credential via
//      getRedirectResult(), exchanges the idToken and navigates the user.
//
// No Firebase Console / Google Cloud Console changes are required, and the
// desktop website keeps its unchanged popup flow.
const isNative = Capacitor.isNativePlatform();

// Role chosen on the Login screen (buyer/seller/delivery) must survive the
// full-page redirect round-trip so first-time users register with it.
const GOOGLE_ROLE_KEY = 'weynishop:googleRole';

export const stashGoogleRole = (role) => {
  try {
    if (role) sessionStorage.setItem(GOOGLE_ROLE_KEY, role);
    else sessionStorage.removeItem(GOOGLE_ROLE_KEY);
  } catch { /* storage may be unavailable */ }
};

export const takeStashedGoogleRole = () => {
  try {
    const role = sessionStorage.getItem(GOOGLE_ROLE_KEY);
    sessionStorage.removeItem(GOOGLE_ROLE_KEY);
    return role || undefined;
  } catch {
    return undefined;
  }
};

const buildProvider = () => {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
};

// ---------------------------------------------------------------------------
// Pending-login bridge (legacy deep-link path)
// ---------------------------------------------------------------------------
// If a com.weynishop.app://auth/callback URL ever arrives (appUrlOpen
// listener in deeplink.js — kept as a fallback), or the redirect completes
// without a full navigation, the awaiting caller below is resolved here.
let pendingNative = null;

export const resolvePendingGoogleSignIn = (result) => {
  if (!pendingNative) return false;
  const { resolve } = pendingNative;
  pendingNative = null;
  resolve(result);
  return true;
};

export const rejectPendingGoogleSignIn = (err) => {
  if (!pendingNative) return false;
  const { reject } = pendingNative;
  pendingNative = null;
  reject(err);
  return true;
};

export const hasPendingGoogleSignIn = () => !!pendingNative;

/**
 * Start Google sign-in.
 *
 * - Web/desktop browser → popup (existing behaviour, unchanged).
 * - Native app → redirect INSIDE the WebView using the real authDomain.
 *   The WebView navigates away to accounts.google.com, so this promise
 *   usually never resolves in this page — finishBootGoogleRedirect()
 *   completes the login when the app reloads on return. If the flow
 *   completes without a navigation, the promise resolves here instead.
 *   `role` is stashed so registration keeps the user's chosen role.
 */
export const signInWithGoogle = (role) => {
  if (isNative) {
    if (pendingNative) return pendingNative.promise; // prevent duplicate taps
    let resolve, reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    pendingNative = { promise, resolve, reject };

    (async () => {
      try {
        stashGoogleRole(role);
        // NOTE: keep the default browserLocalPersistence — the redirect
        // flow needs storage that survives the full-page navigation
        // (inMemoryPersistence breaks signInWithRedirect round-trips).
        await signInWithRedirect(firebaseAuth, buildProvider());
        // If the WebView completed in-page (no top-level navigation), a
        // credential may already be here — finish immediately.
        const cred = await getRedirectResult(firebaseAuth).catch(() => null);
        if (cred?.user && pendingNative) {
          const idToken = await cred.user.getIdToken(/* forceRefresh */ true);
          resolvePendingGoogleSignIn({ idToken, firebaseUser: cred.user });
        }
        // Otherwise the WebView left for accounts.google.com; this promise
        // stays pending and finishBootGoogleRedirect() finishes the flow
        // after the app reloads. (GoogleSignInButton's watchdog stops the
        // spinner if the user backs out and the page never navigates.)
      } catch (err) {
        rejectPendingGoogleSignIn(err);
      }
    })();

    return promise;
  }

  // Web: existing popup behaviour (desktop website unchanged).
  return (async () => {
    const cred = await signInWithPopup(firebaseAuth, buildProvider());
    const idToken = await cred.user.getIdToken(/* forceRefresh */ true);
    return { idToken, firebaseUser: cred.user };
  })();
};

/**
 * Resolve a Google credential after the redirect returned (native only).
 * Used by the boot finisher and the legacy appUrlOpen deep-link path.
 * Resolves with { idToken } or null when there is no pending redirect.
 */
export const finishGoogleSignIn = async () => {
  if (!isNative) return null;
  try {
    const cred = await getRedirectResult(firebaseAuth);
    if (!cred?.user) return null;
    const idToken = await cred.user.getIdToken(/* forceRefresh */ true);
    return { idToken, firebaseUser: cred.user };
  } catch (err) {
    // Rejected redirect (user cancelled etc.) — surface the code so the
    // caller can show the right message instead of "no credential".
    return { error: err?.code || String(err?.message || 'unknown') };
  }
};

/** Sign out of Firebase (does not clear our app's JWT — call useAuth.logout for that). */
export const signOutFirebase = async () => {
  const tasks = [firebaseSignOut(firebaseAuth).catch(() => { })];
  await Promise.all(tasks);
};

export { app as firebaseApp };
