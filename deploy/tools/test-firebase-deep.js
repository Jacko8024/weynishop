// Deep Firebase test — run INSIDE the API container.
// 1. Replicates env.js normalization on the raw private key.
// 2. Initializes Admin SDK (as the server would).
// 3. Fetches the project config incl. authorizedDomains (popup domain check).
// 4. Verifies a deliberately-invalid ID token to prove verifyIdToken works.
const admin = require('firebase-admin');

const raw = process.env.FIREBASE_PRIVATE_KEY || '';
const normalized = raw
    .trim()
    .replace(/^\s*\\?["']|\\?["']\s*$/g, '')
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n');

console.log('raw length:', raw.length);
console.log('normalized starts with:', JSON.stringify(normalized.slice(0, 40)));
console.log('normalized has real newlines:', normalized.includes('\n'));
console.log('normalized ends with:', JSON.stringify(normalized.slice(-30)));

try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: normalized,
        }),
    });
    console.log('INIT_OK');
} catch (e) {
    console.log('INIT_FAIL:', e.message);
    process.exit(1);
}

(async () => {
    try {
        const cfg = await admin.auth().getProjectConfig();
        console.log('\nAUTHORIZED DOMAINS:');
        (cfg.authorizedDomains || []).forEach((d) => console.log('  -', d));
    } catch (e) {
        console.log('getProjectConfig FAIL:', e.message);
    }

    try {
        await admin.auth().verifyIdToken('obviously-invalid-token');
        console.log('\nverifyIdToken: UNEXPECTED SUCCESS');
    } catch (e) {
        console.log('\nverifyIdToken correctly rejected bad token:', e.code || e.message);
    }
    process.exit(0);
})();
