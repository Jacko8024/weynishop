// ADD weynishop.com + www.weynishop.com to Firebase Auth authorized domains.
// Uses the service-account credentials already present in the container env.
const { GoogleAuth } = require('google-auth-library');

const raw = process.env.FIREBASE_PRIVATE_KEY || '';
const normalized = raw
    .trim()
    .replace(/^\s*\\?["']|\\?["']\s*$/g, '')
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n');

const ADD_DOMAINS = ['weynishop.com', 'www.weynishop.com'];

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

    // 1. Read current config.
    let res = await fetch(
        `https://identitytoolkit.googleapis.com/v2/projects/${pid}/config`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    const cfg = await res.json();
    if (!res.ok) {
        console.log('READ_FAIL', res.status, JSON.stringify(cfg));
        process.exit(1);
    }
    const current = cfg.authorizedDomains || [];
    console.log('BEFORE:', current.join(', '));

    // 2. Merge new domains (idempotent).
    const merged = [...new Set([...current, ...ADD_DOMAINS])];
    if (merged.length === current.length) {
        console.log('ALREADY_AUTHORIZED — nothing to do.');
        process.exit(0);
    }

    // 3. Patch (updateMask required — without it the API tries to update every
    // field and rejects immutable ones like email templates).
    res = await fetch(
        `https://identitytoolkit.googleapis.com/v2/projects/${pid}/config?updateMask=authorizedDomains`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ authorizedDomains: merged }),
        }
    );
    const updated = await res.json();
    if (!res.ok) {
        console.log('PATCH_FAIL', res.status, JSON.stringify(updated));
        process.exit(1);
    }
    console.log('AFTER:', (updated.authorizedDomains || []).join(', '));
    console.log('SUCCESS');
    process.exit(0);
})().catch((e) => { console.log('ERR:', e.message); process.exit(1); });
