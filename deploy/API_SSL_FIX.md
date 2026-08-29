# Fixing `api.weynishop.com` — SSL + wrong-site routing

**Symptom:** `https://weynishop.com` loads, but no products appear. Browser
console shows failed requests to `https://api.weynishop.com` (SSL/certificate
errors), so every API call fails → "no products".

---

## Root cause (verified 2026-08-28)

The Contabo VPS `169.58.219.232` (`vmi3526556.contaboserver.net`) runs a plain
**nginx/1.24.0 (Ubuntu)** reverse proxy that hosts several sites. Evidence:

| Check | Result |
|---|---|
| `nslookup api.weynishop.com` | → `169.58.219.232` ✅ DNS is correct |
| `nslookup weynishop.com` / `www` | → `169.58.219.232` ✅ |
| `curl https://weynishop.com/` | **200 OK**, correct WeyniShop React site, valid cert ✅ |
| `curl https://api.weynishop.com/api/v1/health` | TLS error: `SEC_E_WRONG_PRINCIPAL` — the certificate served does **not** cover `api.weynishop.com` ❌ |
| `curl -k https://api.weynishop.com/` | Serves the **Edl Games betting site** (a different app on the same VPS) ❌ |
| `curl -k .../api/v1/health` | `Cannot GET /api/v1/health` — wrong app entirely ❌ |
| Frontend bundle (`/assets/index-C4jUVJak.js`) | Contains `api.weynishop.com` → `VITE_API_URL` was baked in correctly ✅ |

**Conclusion:** there is **no nginx server block (vhost) for
`api.weynishop.com`**. nginx therefore falls back to its *default* vhost —
the Edl Games site — which:

1. Presents a certificate for a **different domain** → browsers block the
   HTTPS request (this is the "no valid SSL certificate" you saw).
2. Routes the request to the **wrong application** → the WeyniShop API's
   `/api/v1/*` routes 404 with `Cannot GET ...`.

The WeyniShop API itself is healthy (DB seeded with 8 products, healthcheck
passes inside the VPS network) — only the public reverse-proxy entry is missing.

---

## Fast path — the one-shot script

All the steps below are automated in
[`deploy/apply-api-ssl-fix.sh`](apply-api-ssl-fix.sh). On the VPS as root:

```bash
ssh root@169.58.219.232
bash <(curl -fsSL https://raw.githubusercontent.com/Jacko8024/weynishop/main/deploy/apply-api-ssl-fix.sh)
```

It is **idempotent** — safe to re-run. It auto-detects the API container's
published port, installs the phase-1 vhost, issues the cert (webroot with
standalone fallback), installs the final TLS vhost, and verifies
`/api/v1/health` returns 200. Only fall back to the manual steps below if
something in the script fails or you prefer to run each step by hand.

> If the repo ever becomes private, `curl` from `raw.githubusercontent.com`
> stops working — instead upload and run it:
> `scp deploy/apply-api-ssl-fix.sh root@169.58.219.232:/root/ && ssh root@169.58.219.232 'bash /root/apply-api-ssl-fix.sh'`

---

## The fix — TWO PHASES (run on the VPS as root)

Two config files are committed:

- [`deploy/nginx/weynishop-api-phase1.conf`](nginx/weynishop-api-phase1.conf) —
  temporary port-80-only vhost (needed **before** certbot)
- [`deploy/nginx/weynishop-api.conf`](nginx/weynishop-api.conf) — the final
  TLS + proxy vhost (install **after** the certificate exists)

Why two phases? Chicken-and-egg: the final vhost references the certificate
files, and nginx refuses to load a server block whose `ssl_certificate` file
doesn't exist — but certbot's webroot challenge needs a port-80 vhost for
`api.weynishop.com` to already exist. Phase 1 breaks the loop.

### 0. Get both files onto the VPS

On your PC (from the repo root):

```bash
scp deploy/nginx/weynishop-api-phase1.conf deploy/nginx/weynishop-api.conf root@169.58.219.232:/root/
```

(Or `git pull` the repo on the VPS if you have it cloned there.)

### 1. Confirm where the API is actually listening

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -i api
```

Expected: something like `0.0.0.0:3000->3000/tcp`. If your port differs,
edit the `upstream weynishop_api { server 127.0.0.1:3000; }` line in
`/root/weynishop-api.conf` to match. (All ports except 80/443 are firewalled
from outside, so it's fine that the app port isn't public.)

### 2. PHASE 1 — port-80 vhost + certificate

```bash
cp /root/weynishop-api-phase1.conf /etc/nginx/sites-available/weynishop-api
ln -sf /etc/nginx/sites-available/weynishop-api /etc/nginx/sites-enabled/weynishop-api
mkdir -p /var/www/html
nginx -t && systemctl reload nginx

# Verify the vhost answers (should be 503, NOT the Edl Games page):
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: api.weynishop.com" http://127.0.0.1/
# → 503

# Issue the certificate (retry in a few minutes on "Service busy; retry later")
certbot certonly --webroot -w /var/www/html \
  -d api.weynishop.com \
  --email yaikobdereje@gmail.com \
  --agree-tos -n
```

> **If certbot keeps failing with webroot**, use the standalone authenticator
> instead — it runs its own temporary webserver, but needs port 80 free for a
> few seconds, so stop nginx first:
> ```bash
> systemctl stop nginx
> certbot certonly --standalone -d api.weynishop.com \
>   --email yaikobdereje@gmail.com --agree-tos -n
> systemctl start nginx
> ```

### 3. PHASE 2 — full TLS + proxy vhost

```bash
cp /root/weynishop-api.conf /etc/nginx/sites-available/weynishop-api
nginx -t && systemctl reload nginx
```

> `nginx -t` must print `syntax is ok` before you reload. If it fails,
> **nothing changes for your live sites** — fix the reported line and retest.

### 4. Verify from outside (back on your PC)

```bash
curl https://api.weynishop.com/api/v1/health
# → {"ok":true,"ts":...}

curl "https://api.weynishop.com/api/v1/products?page=1&limit=2"
# → JSON with the seeded products
```

No certificate warnings, and the browser at `https://weynishop.com` now loads
products. Socket.io tracking works (`wss://api.weynishop.com`).

### 5. Make sure the API's env allows the frontend origin

On the **api** app in Coolify → Environment Variables:

```
CLIENT_URL=https://www.weynishop.com,https://weynishop.com
PUBLIC_API_URL=https://api.weynishop.com
```

Redeploy the api app if you change these (CORS is compiled at boot).

---

## Errors encountered along the way (and their causes)

| Error | Cause / fix |
|---|---|
| `certbot ... Service busy; retry later` | Transient Let's Encrypt-side error. Retry after a few minutes. |
| `cp: cannot stat '/root/weynishop-api.conf'` | The `scp` line was pasted as a comment, so the file was never uploaded. Run the `scp` from your PC first (Step 0). |
| `nginx: [emerg] open() .../sites-enabled/weynishop-api failed` | Symlink pointed at a file that didn't exist. `rm -f /etc/nginx/sites-enabled/weynishop-api` and redo Phase 1. |
| `certbot: unauthorized ... Invalid response ... 404` | `nginx -t` had failed on a config syntax error, so the phase-1 vhost was never actually loaded — the default site still answered port 80. The syntax error: `ssl_session_cache shared:SSL_API 10m` must be `shared:SSL_API:10m` (colon before size). Fixed in the committed config. |
| `nginx: [emerg] invalid session cache "shared:SSL_API"` | Same as above — missing colon. Fixed: `ssl_session_cache shared:SSL_API:10m;` |
| `nginx: [warn] protocol options redefined for 0.0.0.0:443 / [::]:443` | The `http2` listen flag duplicated protocol options across vhosts sharing the sockets. The committed config no longer uses the flag (HTTP/1.1 over TLS is what an API + WebSockets needs anyway). The remaining warning pointing at `sites-enabled/weynishop:23` is pre-existing from another site — harmless. |
| `nginx: [emerg] unknown directive "http2"` | nginx 1.24.0 predates `http2 on;` (added 1.25.1). The committed config uses neither form. |
| `nginx -t` fails ⇒ certbot 404 | **Golden rule:** only run certbot after `nginx -t` prints `syntax is ok` AND `systemctl reload nginx` succeeded. `&&` chaining already enforces this — don't run the certbot line separately if the reload failed. |

---

## Alternative: let Coolify terminate TLS instead

If you'd rather not hand-manage nginx at all, the cleaner long-term setup is
to point `api.weynishop.com` at **Coolify's own Traefik** instead of the VPS's
nginx:

1. In Coolify, open the **api** app → **Domains** → set
   `https://api.weynishop.com`. Traefik will request its own Let's Encrypt
   certificate automatically.
2. Change the DNS record for `api.weynishop.com` to a proxy through Coolify's
   entrypoint — in practice on this VPS that means either stopping the
   site-hosting nginx or moving it to different ports, since both want 80/443.
3. Keep `weynishop.com` / `www` wherever it is now — or move them into Coolify
   too.

This is described as the primary path in
[`COOLIFY_DEPLOY.md`](../COOLIFY_DEPLOY.md) — the manual nginx route above is
the minimal change to unblock production **today** with the VPS's existing
nginx setup.

---

## Quick checklist

- [x] DNS for `api.weynishop.com` → VPS IP (already correct)
- [x] `VITE_API_URL` baked into the frontend bundle (already correct)
- [x] API container healthy, DB seeded (already correct)
- [ ] Phase 1: port-80 vhost installed, certbot cert issued
- [ ] Phase 2: full vhost installed + reloaded
- [ ] `https://api.weynishop.com/api/v1/health` returns `{"ok":true}`
- [ ] Products visible on `https://weynishop.com`
