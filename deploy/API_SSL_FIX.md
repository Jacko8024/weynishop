# Fixing `api.weynishop.com` — SSL + wrong-site routing

**Symptom:** `https://weynishop.com` loads, but no products appear. Browser
console shows failed requests to `https://api.weynishop.com` (SSL/certificate
errors), so every API call fails → "no products". Login / Google sign-in /
account pages also broken.

**STATUS: FIXED (2026-08-29).** Full post-mortem below — three stacked problems
were found and fixed:

| # | Problem | Fix |
|---|---|---|
| 1 | No vhost for `api.weynishop.com` → wrong default site + wrong TLS cert | Phase-1 vhost + certbot + final TLS vhost (this doc) |
| 2 | nginx upstream pointed at the **frontend** container (`127.0.0.1:3001`) — API requests got the SPA's `index.html` | Upstream now points at the API container's docker-network IP, kept in sync by a systemd timer (see below) |
| 3 | `FIREBASE_PRIVATE_KEY` arrived double-escaped + quote-wrapped in the container env → Firebase Admin SDK silently never initialized → Google sign-in dead | Normalization in `platform/server/src/config/env.js` |

---

## Root cause 1 — missing vhost (verified 2026-08-28)

The Contabo VPS `169.58.219.232` (`vmi3526556.contaboserver.net`) runs a plain
**nginx/1.24.0 (Ubuntu)** reverse proxy that hosts several sites. Evidence:

| Check | Result |
|---|---|
| `nslookup api.weynishop.com` | → `169.58.219.232` ✅ DNS is correct |
| `curl https://weynishop.com/` | 200 OK, correct WeyniShop React site ✅ |
| `curl https://api.weynishop.com/api/v1/health` | TLS error: cert does not cover `api.weynishop.com` ❌ |
| `curl -k .../api/v1/health` | `Cannot GET /api/v1/health` — wrong app entirely ❌ |

**Conclusion:** there was no nginx server block for `api.weynishop.com`, so
nginx fell back to its default vhost (Edl Games) with the wrong cert + wrong app.

## Root cause 2 — wrong upstream port (verified 2026-08-29)

After the cert was issued and the vhost installed, `/api/v1/health` still
returned the **SPA's `index.html`** (`content-type: text/html`, `ETag`, 14 KB)
instead of the API's `{"ok":true}` JSON. Deep-dive on the VPS:

```
$ docker ps --format 'table {{.Names}}\t{{.Ports}}'
NAMES                                   PORTS
1evc01pov2yxozvq9egjncpw-... (web)      3000/tcp, 127.0.0.1:3001->80/tcp
vlwh42jori9sj0gxd5eikgmn-... (api)      3000/tcp          <-- NOT published!
q5jowusbarxvfnzgsjgtqxqg    (postgres)  5432/tcp          <-- NOT published
```

Coolify's DB confirmed: `applications` table → `web` has
`ports_mappings = 127.0.0.1:3001:80`, **`api` has NO ports_mappings**. The API
container is only reachable inside the `coolify` docker network (10.0.1.0/24).

The original port-detection in `apply-api-ssl-fix.sh` failed two ways:

1. its grep only matched `0.0.0.0:PORT` mappings (Coolify publishes
   `127.0.0.1:PORT`), so name-based detection silently failed;
2. the fallback probe accepted **any** HTTP 200 — and the SPA's
   `try_files ... /index.html` fallback also answers 200 on `/api/v1/health`,
   so the probe picked the frontend container. The vhost ended up with
   `server 127.0.0.1:3001;` = the web container.

**Fix (both):**
- `apply-api-ssl-fix.sh` now matches all bind addresses and **requires the JSON
  body `{"ok":true}`** before accepting a port as the API.
- Because the API has no stable host port, the live vhost's upstream points at
  the API container's **docker-network IP**, which changes on every redeploy.
  A systemd timer (`weynishop-api-sync`) re-discovers the IP every minute and
  rewrites the upstream when it drifts — verified live: after a container
  restart moved the API from `10.0.1.11` to `10.0.1.7`, the timer healed the
  vhost automatically within one run.

### The self-healing timer (installed on the VPS)

- Script: `/usr/local/bin/weynishop-api-sync.sh` (source:
  [`deploy/nginx/weynishop-api-sync.sh`](nginx/weynishop-api-sync.sh))
- Units: `weynishop-api-sync.service` + `.timer` in `/etc/systemd/system/`
  (sources: [`weynishop-api-sync.service`](nginx/weynishop-api-sync.service),
  [`weynishop-api-sync.timer`](nginx/weynishop-api-sync.timer))
- Runs every minute; no-ops when the IP is unchanged; refuses to touch nginx if
  the API doesn't answer `{"ok":true}`; reverts itself if `nginx -t` fails.
- Inspect with: `journalctl -u weynishop-api-sync.service -n 20`

> **Long-term alternative:** give the API a published host port in Coolify
> (e.g. `127.0.0.1:3000:3000`) — then the vhost can use a static
> `server 127.0.0.1:3000;` and the timer becomes unnecessary. The timer is
> harmless either way.

## Root cause 3 — Firebase private key double-escaped (verified 2026-08-29)

Symptom: with routing fixed, Google sign-in still failed. Test inside the API
container showed:

```
key first 40 chars = "\\\"-----BEGIN PRIVATE KEY-----\\\nMIIEvQIBAD"
key starts with BEGIN header = false
adminReady = NULL — NOT INITIALIZED
```

The env value arrived **wrapped in literal quotes and with `\\n` (double-escaped)
newlines** (a paste-into-Coolify artifact). `looksLikePlaceholder()` in
`src/config/firebase.js` requires the key to start with
`-----BEGIN PRIVATE KEY-----`, so the SDK was silently disabled and every
Google ID token verification failed with "Firebase admin not configured".

**Fix:** `platform/server/src/config/env.js` now normalizes the key — strips
wrapping (escaped) quotes and unescapes `\\n` → `\n` → real newlines. Verified
live in the container:

```
adminReady = INITIALIZED OK
FIREBASE AUTH API REACHABLE, users fetched = 1
```

> The **client-side** Firebase config (in `src/lib/firebase.js`) is public and
> fine. Remember that `weynishop.com` / `www.weynishop.com` must be listed in
> Firebase Console → Authentication → Settings → Authorized domains (the popup
> refuses to open otherwise).

---

## Verification (all green, 2026-08-29)

| Check | Result |
|---|---|
| `https://api.weynishop.com/api/v1/health` | `200 application/json` `{"ok":true}` |
| CORS preflight from `https://www.weynishop.com` | `204` + `access-control-allow-origin: https://www.weynishop.com` |
| `GET /api/v1/products?limit=1` | `200 application/json` with real DB rows |
| `POST /api/v1/auth/login` (bad creds) | `401 application/json` `{"message":"Invalid credentials"}}` (proper JSON, not SPA HTML) |
| `POST /api/v1/auth/google` (bad token) | `401 application/json` |
| Socket.io handshake | `200` |
| DB counts | users 4, products 8, categories 12 |
| Sync timer after container restart (IP 10.0.1.11 → 10.0.1.7) | auto-healed upstream, service stayed up |

---

## Fast path — the one-shot script

All phase-1/phase-2 steps are automated in
[`deploy/apply-api-ssl-fix.sh`](apply-api-ssl-fix.sh). On the VPS as root:

```bash
ssh root@169.58.219.232
bash <(curl -fsSL https://raw.githubusercontent.com/Jacko8024/weynishop/main/deploy/apply-api-ssl-fix.sh)
```

It is **idempotent** — safe to re-run. It auto-detects the API container's
port (now requiring the `{"ok":true}` JSON body so it can't be fooled by the
SPA), installs the phase-1 vhost, issues the cert, installs the final TLS
vhost, and verifies the API answers with real JSON.

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
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -i weynishop
```

The API container (`vlwh42jori9sj0gxd5eikgmn-...`) publishes **no host port** —
it lives on the `coolify` docker network. Its current IP:

```bash
docker inspect $(docker ps -q --filter "label=coolify.fqdn=api.weynishop.com") \
  --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
```

Use that IP (port 3000) in the `upstream` block, or install the sync timer
(see above) which maintains it automatically.

### 2. PHASE 1 — port-80 vhost + certificate

```bash
cp /root/weynishop-api-phase1.conf /etc/nginx/sites-available/weynishop-api
ln -sf /etc/nginx/sites-available/weynishop-api /etc/nginx/sites-enabled/weynishop-api
mkdir -p /var/www/html
nginx -t && systemctl reload nginx

certbot certonly --webroot -w /var/www/html -d api.weynishop.com \
  --email yaikobdereje@gmail.com --agree-tos -n
```

### 3. PHASE 2 — final TLS + proxy vhost

Edit `upstream weynishop_api { server 127.0.0.1:3000; }` in
`weynishop-api.conf` to the API container's docker-network IP (or rely on the
sync timer), then:

```bash
cp /root/weynishop-api.conf /etc/nginx/sites-available/weynishop-api
nginx -t && systemctl reload nginx
```

### 4. Install the self-healing timer (recommended)

```bash
cp deploy/nginx/weynishop-api-sync.sh /usr/local/bin/
chmod +x /usr/local/bin/weynishop-api-sync.sh
cp deploy/nginx/weynishop-api-sync.{service,timer} /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now weynishop-api-sync.timer
```

---

## Ops notes

- **Do not rely on the container hot-patch of `env.js`** — it is overwritten
  on the next Coolify deploy. The fix is in `main`
  (`platform/server/src/config/env.js`); any redeploy from GitHub keeps it.
- Helper for running remote diagnostics from a Windows PC:
  [`deploy/tools/vps_exec.py`](tools/vps_exec.py) (password via
  `WEYNIVPS_PASS` env var — never hardcoded).
- Deep-check script: [`deploy/tools/vps_deep_check.sh`](tools/vps_deep_check.sh)
  — bundle URL, container logs, DB counts, auth smoke tests, websocket, timer.
