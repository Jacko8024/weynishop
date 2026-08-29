import admin from 'firebase-admin';
import { env } from './env.js';

// Tracks whether we've already attempted initialization. `adminReady` holds
// the admin SDK once it's usable, or null when credentials are missing/invalid.
let initialized = false;
let adminReady = null;

// A private key that is clearly a placeholder (contains "..." or lacks the PEM
// header) means the service account hasn't really been configured yet.
const looksLikePlaceholder = (key) =>
  !key ||
  key.includes('...') ||
  !key.trim().startsWith('-----BEGIN PRIVATE KEY-----');

/**
 * Normalize a private key that was stored in env vars by any of the common
 * (mis)formats: wrapped in extra quotes, containing literal "\n" sequences
 * instead of real newlines, or with stray leading/trailing whitespace.
 * Coolify / docker-compose / .env files frequently produce these variants.
 */
const normalizePrivateKey = (raw) => {
  if (!raw) return '';
  let key = raw.trim();
  // Strip wrapping quotes (single or double) if the whole value is quoted.
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  // Literal "\n" text → real newlines (happens when the JSON key is pasted
  // into a single-line env field without escaping).
  if (!key.includes('\n')) key = key.replace(/\\n/g, '\n');
  return key;
};

/**
 * Lazily initialize the Firebase Admin SDK using env-var service-account
 * credentials. Returns the singleton admin app, or null if env is incomplete
 * (so the rest of the server can still boot in setups that don't need Google
 * sign-in).
 */
export const getFirebaseAdmin = () => {
  if (initialized) return adminReady;
  initialized = true;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL } = env;
  const FIREBASE_PRIVATE_KEY = normalizePrivateKey(env.FIREBASE_PRIVATE_KEY);

  if (
    !FIREBASE_PROJECT_ID ||
    !FIREBASE_CLIENT_EMAIL ||
    looksLikePlaceholder(FIREBASE_PRIVATE_KEY)
  ) {
    console.warn(
      '[firebase] Admin SDK NOT initialized — Google sign-in is disabled.\n' +
      '  To enable it, set real values in server/.env:\n' +
      '    FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY\n' +
      '  Get them from: Firebase Console -> Project settings -> Service accounts\n' +
      '  -> "Generate new private key" (downloads a JSON file with all three).'
    );
    adminReady = null;
    return null;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY,
      }),
    });
    adminReady = admin;
    console.log('[firebase] Admin SDK initialized for project:', FIREBASE_PROJECT_ID);
  } catch (e) {
    // Invalid/malformed credentials must not crash the server. Log once and
    // fall back to "Google sign-in disabled" so other endpoints keep working.
    console.error(
      '[firebase] Admin SDK failed to initialize — check FIREBASE_PRIVATE_KEY and\n' +
      '  FIREBASE_CLIENT_EMAIL in server/.env (regenerate the key in Firebase\n' +
      '  Console -> Project settings -> Service accounts). Reason:',
      e.message
    );
    adminReady = null;
  }
  return adminReady;
};

/** Verify a Firebase ID token. Throws on invalid/expired tokens. */
export const verifyFirebaseIdToken = async (idToken) => {
  const fb = getFirebaseAdmin();
  if (!fb) {
    const err = new Error(
      'Google sign-in is not configured on the server. Add FIREBASE_PROJECT_ID, ' +
      'FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to server/.env, then restart.'
    );
    err.statusCode = 503;
    throw err;
  }
  return fb.auth().verifyIdToken(idToken);
};
