import admin from 'firebase-admin';
import { env } from './env.js';

let initialized = false;

/**
 * Lazily initialize the Firebase Admin SDK using env-var service-account
 * credentials. Returns the singleton admin app, or null if env is incomplete
 * (so the rest of the server can still boot in setups that don't need Google
 * sign-in).
 */
export const getFirebaseAdmin = () => {
  if (initialized) return admin.apps.length ? admin : null;
  initialized = true;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn(
      '[firebase] Admin SDK not initialized — set FIREBASE_PROJECT_ID, ' +
        'FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env to enable Google sign-in.'
    );
    return null;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY,
    }),
  });
  console.log('[firebase] Admin SDK initialized for project:', FIREBASE_PROJECT_ID);
  return admin;
};

/** Verify a Firebase ID token. Throws on invalid/expired tokens. */
export const verifyFirebaseIdToken = async (idToken) => {
  const fb = getFirebaseAdmin();
  if (!fb) {
    const err = new Error('Google sign-in is not configured on the server');
    err.statusCode = 503;
    throw err;
  }
  return fb.auth().verifyIdToken(idToken);
};
