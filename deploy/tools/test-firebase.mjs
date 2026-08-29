// Run inside the API container: node /tmp/test-firebase.mjs
// Verifies whether Firebase Admin actually initializes with the current env.
const { env } = await import('/app/src/config/env.js');
const { getFirebaseAdmin } = await import('/app/src/config/firebase.js');

console.log('FIREBASE_PROJECT_ID =', env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL =', env.FIREBASE_CLIENT_EMAIL);
const key = env.FIREBASE_PRIVATE_KEY || '';
console.log('key length =', key.length);
console.log('key starts with BEGIN header =', key.trim().startsWith('-----BEGIN PRIVATE KEY-----'));
console.log('key first 40 chars =', JSON.stringify(key.slice(0, 40)));
console.log('key contains literal backslash-n =', key.includes('\\n'));
console.log('key contains real newline =', key.includes('\n'));

const admin = getFirebaseAdmin();
console.log('adminReady =', admin ? 'INITIALIZED OK' : 'NULL — NOT INITIALIZED');

if (admin) {
    try {
        // A cheap network call to Google to prove the credential works end to end.
        const list = await admin.auth().listUsers(1);
        console.log('FIREBASE AUTH API REACHABLE, users fetched =', list.users.length);
    } catch (e) {
        console.log('Firebase Auth API call failed:', e.code || '', e.message);
    }
}
process.exit(0);
