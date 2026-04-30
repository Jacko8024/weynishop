import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';

// Public web config — safe to ship to the browser.
// Override any value with VITE_FIREBASE_* if you want per-env configs.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC9pHmRut5vIm0BUzz5RVXGsQbUA2Dv7Sw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'weynishop.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'weynishop',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'weynishop.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '700988913337',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:700988913337:web:1010b09b8317fd31570d68',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YYV0X430EZ',
};

// Idempotent: HMR may re-evaluate this module.
const app = getApps()[0] || initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
firebaseAuth.useDeviceLanguage();

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Open the Google sign-in popup and resolve to a Firebase ID token
 * that the server can verify with firebase-admin.
 */
export const signInWithGoogle = async () => {
  const cred = await signInWithPopup(firebaseAuth, googleProvider);
  const idToken = await cred.user.getIdToken(/* forceRefresh */ true);
  return { idToken, firebaseUser: cred.user };
};

/** Sign out of Firebase (does not clear our app's JWT — call useAuth.logout for that). */
export const signOutFirebase = () => firebaseSignOut(firebaseAuth);

export { app as firebaseApp };
