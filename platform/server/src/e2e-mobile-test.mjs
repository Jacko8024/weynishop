// End-to-end mobile flow test against the local API + Supabase DB:
//   1. health
//   2. register a buyer (or login if exists)
//   3. register FCM device token (mobile push)
//   4. list devices
//   5. CORS preflight from capacitor://localhost (what the Android/iOS app sends)
//   6. products + categories + config (what the mobile home screen loads)
import { request } from 'node:http';
import { request as requestHttps } from 'node:https';

const BASE = (process.env.E2E_BASE || 'http://localhost:5000/api/v1').replace(/\/$/, '');
console.log(`E2E target: ${BASE}`);
const results = [];
const check = (name, ok, detail = '') => {
    results.push({ name, ok, detail });
    console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`);
};

const call = (method, path, { body, token, origin } = {}) =>
    new Promise((resolve) => {
        const data = body ? JSON.stringify(body) : null;
        const req = (BASE.startsWith('https') ? requestHttps : request)(
            new URL(BASE + path),
            {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(origin ? { Origin: origin } : {}),
                    ...(method === 'OPTIONS' ? { 'Access-Control-Request-Method': method === 'OPTIONS' ? 'GET' : method } : {}),
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
                },
            },
            (res) => {
                let buf = '';
                res.on('data', (c) => (buf += c));
                res.on('end', () => {
                    let json = null;
                    try { json = JSON.parse(buf); } catch { }
                    resolve({ status: res.statusCode, headers: res.headers, json, raw: buf });
                });
            }
        );
        req.on('error', (e) => resolve({ status: 0, error: e.message }));
        if (data) req.write(data);
        req.end();
    });

// 1. Health
const health = await call('GET', '/health');
check('health endpoint', health.status === 200 && health.json?.ok === true);

// 2. Auth: register unique buyer, fall back to login on 409
const email = `mobiletest_${Date.now()}@weynitest.local`;
let auth = await call('POST', '/auth/register', {
    body: { name: 'Mobile E2E', email, password: 'Test1234!', role: 'buyer' },
});
if (auth.status === 409) {
    auth = await call('POST', '/auth/login', { body: { email, password: 'Test1234!' } });
}
check('auth register/login', auth.status === 200 || auth.status === 201, `status=${auth.status}`);
const token = auth.json?.token;
check('JWT issued', !!token);

// 3. Mobile push device registration (what the Capacitor app does post-login)
if (token) {
    const fakeFcm = `e2e-test-token-${Date.now()}`;
    const dev = await call('POST', '/notifications/devices', {
        body: { token: fakeFcm, platform: 'android' },
        token,
    });
    check('FCM device registration (device_tokens table)', dev.status === 201, `status=${dev.status} ${dev.json?.message || ''}`);

    const list = await call('GET', '/notifications/devices', { token });
    check('device list', list.status === 200 && Array.isArray(list.json?.devices), `devices=${list.json?.devices?.length ?? '?'}`);

    const del = await call('DELETE', `/notifications/devices/${encodeURIComponent(fakeFcm)}`, { token });
    check('device deregistration', del.status === 200 && del.json?.removed === 1);
}

// 4. CORS preflights from the mobile WebView origins
for (const origin of ['capacitor://localhost', 'https://localhost', 'http://localhost']) {
    const pre = await call('OPTIONS', '/products?limit=1', { origin });
    const allowOrigin = pre.headers?.['access-control-allow-origin'];
    check(`CORS preflight ${origin}`, pre.status === 204 || (pre.status === 200 && allowOrigin === origin), `status=${pre.status} acao=${allowOrigin}`);
}

// 5. Data endpoints the mobile home screen loads
const prods = await call('GET', '/products?limit=3');
check('products list', prods.status === 200 && prods.json?.items?.length > 0, `total=${prods.json?.total}`);

const cats = await call('GET', '/categories');
check('categories list', cats.status === 200 && (Array.isArray(cats.json) || Array.isArray(cats.json?.items)), `count=${(cats.json?.items || cats.json || []).length}`);

const cfg = await call('GET', '/config/public');
check('public config', cfg.status === 200 && typeof cfg.json?.commissionPercent === 'number');

// 6. Unauthorized access must be rejected (protect middleware + DB working)
const noAuth = await call('GET', '/notifications/devices');
check('auth guard (401 without token)', noAuth.status === 401);

const pass = results.filter((r) => r.ok).length;
console.log(`\n=== ${pass}/${results.length} passed ===`);
process.exit(pass === results.length ? 0 : 1);
