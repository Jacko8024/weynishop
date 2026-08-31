import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
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
// NATIVE MOBILE (Capacitor) GOOGLE SIGN-IN — Android Credential Manager
// ---------------------------------------------------------------------------
// WHY NO BROWSER FALLBACK (this was the long-standing Android bug):
//   The old code fell back to signInWithRedirect() inside the app WebView
//   whenever the native plugin hiccupped. Google explicitly disallows OAuth
//   in embedded WebViews ("disallowed_user_agent"): it either fails outright
//   or bounces the flow out to Chrome — and Chrome had no way back into the
//   app, so the login never completed.
//
//   Per current official Google guidance (Credential Manager + Sign in with
//   Google), the native app flow is:
//     1. GoogleAuthPlugin.java launches Google's OFFICIAL account chooser
//        (every Google account on the device + "Add another account").
//     2. It returns a Google ID token minted for the project's public web
//        OAuth client (client_type 3 — the SAME client the website uses).
//     3. We exchange it into a Firebase credential via signInWithCredential
//        → same Firebase user/UID as the website.
//     4. A fresh Firebase ID token goes to the EXISTING POST /auth/google
//        endpoint (find-or-create by firebaseUid/email → WeyniShop JWT).
//   No WebView, no Chrome tab, no embedded browser — the flow returns to the
//   app directly from Google's native chooser sheet.
const isNative = Capacitor.isNativePlatform();

// Registered by MainActivity (GoogleAuthPlugin.java). The web bundle never
// hard-imports a native module; on the website the proxy is never called.
const GoogleAuth = Capacitor.registerPlugin('GoogleAuth', {
  web: {
    signIn: () => Promise.reject(new Error('GoogleAuth is native-only')),
    signOut: () => Promise.resolve(),
  },
});

/**
 * Native path: Google's official account chooser → Google ID token →
 * Firebase credential → fresh Firebase ID token for POST /auth/google.
 * Rejects with code CANCELLED when the user dismisses the chooser.
 */
const nativeGoogleSignIn = async () => {
  try {
    const res = await GoogleAuth.signIn(); // { idToken, displayName?, photoUrl? }
    const credential = GoogleAuthProvider.credential(res.idToken);
    const cred = await signInWithCredential(firebaseAuth, credential);
    const idToken = await cred.user.getIdToken(/* forceRefresh */ true);
    return { idToken, firebaseUser: cred.user };
  } catch (err) {
    // Capacitor rejects plugin calls with a plain object { code, message } —
    // not an Error instance. Wrap it so the code (CANCELLED /
    // NO_CREDENTIALS / NATIVE_ERROR …) and message survive intact to
    // GoogleSignInButton's cancel-vs-error handling.
    if (err && typeof err === 'object' && !(err instanceof Error)) {
      throw Object.assign(new Error(err.message || 'Google sign-in failed'), {
        code: err.code,
        data: err.data,
      });
    }
    throw err;
  }
};

// Role chosen on the Login screen (buyer/seller/delivery) must reach the
// registration call for first-time users.
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

/**
 * Start Google sign-in.
 *
 * - WEBSITE (desktop or mobile browser): popup — existing behaviour,
 *   completely unchanged.
 * - NATIVE APP: Google's native account chooser ONLY. There is deliberately
 *   NO WebView/redirect fallback: a fallback that opens Chrome is exactly
 *   the bug this replaced, and signInWithRedirect inside a Capacitor
 *   WebView is rejected by Google (disallowed_user_agent). If the native
 *   chooser genuinely fails (no Play services etc.) we surface the error
 *   to the user — email/phone login remains available.
 *
 * Native error contract (from GoogleAuthPlugin.java):
 *   CANCELLED | NO_CREDENTIALS | EMPTY_TOKEN | NO_ACTIVITY | …
 */
export const signInWithGoogle = async (role) => {
  if (isNative) {
    stashGoogleRole(role);
    return nativeGoogleSignIn();
  }

  // Web: existing popup behaviour (desktop website unchanged).
  const cred = await signInWithPopup(firebaseAuth, buildProvider());
  const idToken = await cred.user.getIdToken(/* forceRefresh */ true);
  return { idToken, firebaseUser: cred.user };
};

/** Sign out of Firebase (does not clear our app's JWT — call useAuth.logout). */
export const signOutFirebase = async () => {
  const tasks = [firebaseSignOut(firebaseAuth).catch(() => { })];
  // Native: clear Credential Manager state so the next sign-in shows the
  // full account chooser again (account switching after logout works).
  if (isNative) tasks.push(GoogleAuth.signOut().catch(() => { }));
  await Promise.all(tasks);
};

export { app as firebaseApp };
