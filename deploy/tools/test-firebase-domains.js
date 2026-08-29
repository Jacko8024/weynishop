// Check Firebase Auth authorized domains via google-auth-library OAuth.
const { GoogleAuth } = require('google-auth-library');

const raw = process.env.FIREBASE_PRIVATE_KEY || '';
const normalized = raw
    .trim()
    .replace(/^\s*\\?["']|\\?["']\s*$/g, '')
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n');

(async () => {
    const auth = new GoogleAuth({
        credentials: {
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: normalized,
        },
        scopes: ['https://www.googleapis.com/auth/identitytoolkit', 'https://www.googleapis.com/auth/firebase'],
    });
    const client = await auth.getClient();
    const { token } = await client.getAccessToken();
    const pid = process.env.FIREBASE_PROJECT_ID;
    const res = await fetch(
        `https://identitytoolkit.googleapis.com/v2/projects/${pid}/config`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const body = await res.json();
    if (!res.ok) {
        console.log('CONFIG_FAIL', res.status, JSON.stringify(body));
        process.exit(1);
    }
    console.log('AUTHORIZED DOMAINS:');
    (body.authorizedDomains || []).forEach((d) => console.log('  -', d));
    process.exit(0);
})().catch((e) => { console.log('ERR:', e.message); process.exit(1); });
