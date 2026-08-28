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

## The fix (run on the VPS as root)

The finished nginx config is committed at
[`deploy/nginx/weynishop-api.conf`](../deploy/nginx/weynishop-api.conf) —
TLS termination + proxy to the API container + Socket.io WebSocket support.

### 1. Confirm where the API is actually listening

Coolify publishes each app on a host port. Find the WeyniShop API container:

```bash
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -i api
```

Expected: something like `0.0.0.0:3000->3000/tcp`. If your port differs,
edit the `upstream weynishop_api { server 127.0.0.1:3000; }` line in the
config file to match. (All ports except 80/443 are firewalled from outside,
so it's fine that the app port isn't public.)

### 2. Install certbot and get the certificate

```bash
apt update && apt install -y certbot python3-certbot-nginx

# Issue the cert for the API subdomain
certbot certonly --webroot -w /var/www/html \
  -d api.weynishop.com \
  --email your-email@example.com \
  --agree-tos -n
```

> If `/var/www/html` doesn't exist: `mkdir -p /var/www/html` first, or use
> `certbot certonly --nginx -d api.weynishop.com ...` instead.
> Renewals are automatic (`certbot` installs a systemd timer) — the nginx
> config below reloads nginx gracefully on renewal via the deploy hook if
> you add one.

### 3. Install the nginx vhost

```bash
# Upload the file from your PC:
#   scp deploy/nginx/weynishop-api.conf root@169.58.219.232:/root/
# Then on the VPS:
cp /root/weynishop-api.conf /etc/nginx/sites-available/weynishop-api
ln -sf /etc/nginx/sites-available/weynishop-api /etc/nginx/sites-enabled/weynishop-api

# Sanity check + apply
nginx -t && systemctl reload nginx
```

### 4. Verify from outside

```bash
curl https://api.weynishop.com/api/v1/health
# → {"ok":true,"ts":...}

curl "https://api.weynishop.com/api/v1/products?page=1&limit=2"
# → JSON with the seeded products

# No certificate warnings, and the browser at https://weynishop.com now
# loads products. Socket.io tracking works (wss://api.weynishop.com).
```

### 5. Make sure the API's env allows the frontend origin

On the **api** app in Coolify → Environment Variables:

```
CLIENT_URL=https://www.weynishop.com,https://weynishop.com
PUBLIC_API_URL=https://api.weynishop.com
```

Redeploy the api app if you change these (CORS is compiled at boot).

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
- [ ] certbot cert issued for `api.weynishop.com`
- [ ] nginx vhost installed + reloaded
- [ ] `https://api.weynishop.com/api/v1/health` returns `{"ok":true}`
- [ ] Products visible on `https://weynishop.com`
