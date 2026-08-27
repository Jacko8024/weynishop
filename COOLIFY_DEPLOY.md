# Deploying WeyniShop on Coolify (Contabo VPS)

Self-hosted deployment of the full platform on your own VPS using
[Coolify](https://coolify.io) (open-source Heroku/Vercel alternative).

## Architecture

```
                        ┌─────────────────────────────────────────────┐
 Internet ──HTTPS──►    │  Contabo VPS (Coolify + Traefik proxy)      │
                        │                                             │
  www.yourdomain.com ──►│  web   : nginx + React build   (port 80)    │
  api.yourdomain.com ──►│  api   : Node/Express+Socket.io(port 3000)  │
                        └──────────────┬──────────────────────────────┘
                                       │ DATABASE_URL (SSL)
                                       ▼
                        Supabase Postgres  +  Supabase Storage (images)
```

| Piece | Where it runs | Notes |
|---|---|---|
| **web** (React/Vite) | Coolify app, nginx container | `platform/client/Dockerfile` |
| **api** (Express + Socket.io) | Coolify app, Node 20 container | `platform/server/Dockerfile` |
| **Database** | Supabase Postgres (existing) | No migration needed. Option B: Coolify-managed Postgres |
| **Image storage** | Supabase Storage | Required — uploads go there, containers stay stateless |

Both containers are **stateless** (no volumes needed): images live in Supabase
Storage and all data in Postgres, so Coolify can redeploy/replace them freely.

---

## Prerequisites

1. **Contabo VPS** — Ubuntu 24.04 (fresh install recommended).
   - Minimum: 2 vCPU / 4 GB RAM. Recommended: 4 vCPU / 6–8 GB RAM, 50 GB+ SSD.
2. **A domain name** with DNS A records pointing at the VPS IP:
   - `www.yourdomain.com` → VPS IP
   - `yourdomain.com` → VPS IP (optional apex)
   - `api.yourdomain.com` → VPS IP
   - (You can skip the custom domain for a first test — Coolify generates a
     `https://<random>.yourserver.coolify.app` URL for each app.)
3. **Contabo firewall / VPS firewall**: allow inbound **22 (SSH), 80, 443**.
   Contabo panel → your VPS → *Firewall* — make sure HTTP/HTTPS are open.
4. **GitHub repo** — already done: `Jacko8024/weynishop` (must contain the
   Dockerfiles from this repo).
5. **Supabase credentials** from your existing project:
   - `DATABASE_URL` (Project Settings → Database → Connection string URI, pooler port 6543)
   - `SUPABASE_URL` (`https://<ref>.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → service_role secret)
   - If Supabase → Settings → Database → **Network restrictions** is enabled,
     add your VPS IP (or disable the restriction).

---

## Step 1 — Install Coolify on the VPS

SSH into the VPS and run the one-liner installer (as root):

```bash
ssh root@YOUR_VPS_IP
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

The installer:
- installs Docker if it's missing,
- pulls Coolify and starts it on port **8000**.

When it finishes, open **`http://YOUR_VPS_IP:8000`** in your browser and
create your admin account (first user becomes root).

> Tip: in Coolify → *Settings*, set the instance domain to
> `http://YOUR_VPS_IP:8000` (or a domain like `coolify.yourdomain.com` if you
> want SSL for the dashboard itself).

---

## Step 2 — Connect your GitHub account

1. Coolify sidebar → **Sources** → **+ Add** → **GitHub**.
2. Recommended: **GitHub App** — works with private repos, gives automatic
   deploy webhooks. Follow the prompts to install it on your account and grant
   access to the `Jacko8024/weynishop` repository only.
3. Alternative: **Deploy key** (add the shown public key in GitHub → repo →
   Settings → Deploy keys).

---

## Step 3 — Create the project

1. **Projects** → **+ New Project** → name it `weynishop`.
2. Inside the project you'll create two applications: **api** and **web**.

---

## Step 4 — Create the API application

1. Project → **+ New Resource** → **Application**.
2. Choose your GitHub source → `Jacko8024/weynishop` → branch `main`.
3. Name it **`api`**.
4. Configuration (the app is auto-detected as *Dockerfile*; verify):
   - **Build Pack:** `Dockerfile`
   - **Base Directory:** `platform/server`
   - **Dockerfile Location:** `Dockerfile`
   - **Ports Exposed:** `3000`
   - **Health Check:** method GET, path `/api/v1/health`, port `3000`
5. **Domains** → add `https://api.yourdomain.com`
   (Coolify's Traefik will issue a Let's Encrypt certificate automatically.
   DNS must already point at the VPS.)
6. **Environment Variables** → add all of these (values from your local
   `platform/server/.env` / Supabase):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase pooler URI (`postgres://postgres.<ref>:<pw>@aws-0-….pooler.supabase.com:6543/postgres`) |
| `DB_SSL` | `true` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role JWT |
| `SUPABASE_BUCKET_PRODUCTS` | `product-images` |
| `SUPABASE_BUCKET_BANNERS` | `banner-images` |
| `SUPABASE_BUCKET_DOCS` | `onboarding-docs` |
| `JWT_SECRET` | long random string (generate one!) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | `https://www.yourdomain.com` (comma-separate more origins if needed) |
| `STOREFRONT_URL` | `https://www.yourdomain.com` |
| `GOOGLE_MAPS_API_KEY` | your Maps key |
| `SURPRISE_OWNER_ID` / `SURPRISE_OWNER_EMAIL` | optional |
| `FIREBASE_PROJECT_ID` | `weynishopping` (optional, for Google sign-in) |
| `FIREBASE_CLIENT_EMAIL` | service-account email (optional) |
| `FIREBASE_PRIVATE_KEY` | PEM with literal `\n` (optional) |

   > Don't set `PORT` manually — Coolify injects it (3000) automatically.
   > Mark secrets as **secret** (lock icon) so they're hidden in the UI.

7. Click **Deploy**. Watch **Logs** until you see:

```
[db] connected: postgres://postgres.<ref>:***@aws-0-….pooler.supabase.com:6543/postgres
[api] listening on http://localhost:3000
```

8. Verify: `https://api.yourdomain.com/api/v1/health` → `{"ok":true,...}`

---

## Step 5 — Create the Web application

1. Project → **+ New Resource** → **Application** → same repo, branch `main`.
2. Name it **`web`**.
3. Configuration:
   - **Build Pack:** `Dockerfile`
   - **Base Directory:** `platform/client`
   - **Dockerfile Location:** `Dockerfile`
   - **Ports Exposed:** `80`
   - **Health Check:** method GET, path `/healthz`, port `80`
4. **Domains** → add `https://www.yourdomain.com`
   (and optionally `https://yourdomain.com` as a second domain).
5. **Environment Variables** — ⚠️ Vite bakes these into the bundle **at build
   time**, so for each one open the variable's options and enable
   **"Build Variable"** (build-time):

| Variable | Value | Build Variable |
|---|---|---|
| `VITE_API_URL` | `https://api.yourdomain.com` (your Step 4 URL, no trailing slash) | ✅ yes |
| `VITE_GOOGLE_MAPS_API_KEY` | same Maps key | ✅ yes |
| `VITE_STOREFRONT_URL` | `https://www.yourdomain.com` | ✅ yes |
| `VITE_FIREBASE_*` | optional — defaults are baked into `src/lib/firebase.js` | ✅ yes if set |

6. Click **Deploy**. The build fails fast with a clear error if
   `VITE_API_URL` is missing.
7. When it's healthy, open your domain — the shop should load. Test SPA
   routing directly: `https://www.yourdomain.com/login` must not 404.

---

## Step 6 — Wire CORS (if you didn't already)

Back on the **api** app → Environment Variables → make sure:

```
CLIENT_URL=https://www.yourdomain.com,https://yourdomain.com
```

Redeploy the api app. Without this, browser requests fail with CORS errors.


---

## Step 7 — Database: choose your option

### Option A (recommended): keep Supabase Postgres
Nothing to do — you already pointed `DATABASE_URL` at Supabase in Step 4.
Your existing data, images and schema all keep working. Just confirm the VPS
IP is allowed in Supabase network restrictions.

### Option B: Coolify-managed Postgres on the VPS (fully self-hosted DB)
1. Project → **+ New Resource** → **Database** → **PostgreSQL 16**.
2. After it starts, copy its **internal connection URL** (looks like
   `postgres://user:pass@<container-id>:5432/dbname`).
3. On the **api** app set:
   - `DATABASE_URL` = that internal URL
   - `DB_SSL` = `false`
4. Migrate existing data from Supabase (from your PC):
   ```bash
   pg_dump "postgres://...supabase...:5432/postgres" -Fc -f weynishop.dump
   # upload dump to VPS, then from the VPS (docker exec into the pg container):
   pg_restore -d postgres://user:pass@localhost:<mapped-port>/dbname weynishop.dump
   ```
5. ⚠️ Supabase **Storage is still required** for image uploads
   (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` stay set either way).

---

## Step 8 — Seed data (first deploy only, optional)

The API auto-runs safe migrations/backfills on every boot. If you need the
demo seed (⚠️ `seed.js` uses `sync({force:true})` — it **drops all tables**):

1. Coolify → **api** app → **Terminal** (opens a shell in the container).
2. Run: `node src/seed.js` (or `node src/seed-bulk.js` for the bulk catalog).

Skip this entirely if your Supabase DB already has real data.

---

## Step 9 — External service whitelists

- **Firebase** (Google sign-in): Firebase Console → Authentication → Settings
  → **Authorized domains** → add `www.yourdomain.com` and `yourdomain.com`.
- **Google Maps key**: if you restrict by HTTP referrer, add
  `https://www.yourdomain.com/*` and `https://yourdomain.com/*`.
- **Supabase**: no change needed (Storage is accessed server-side with the
  service-role key).

---

## Updating the site later

With the GitHub App connected, every `git push` to `main` auto-deploys both
apps (Coolify registers the webhook for you). Zero-downtime: Coolify starts
the new container, waits for the healthcheck, then switches traffic.

Manual trigger: app → **Deploy** button.

## Operations cheat-sheet

| Task | Where |
|---|---|
| Live logs | app → **Logs** |
| Shell in container | app → **Terminal** |
| Restart / redeploy | app → **Deploy** / **Restart** |
| SSL certs | automatic (Traefik + Let's Encrypt), app → **Domains** |
| Backups | Coolify → **Backups** (for the DB resource); Supabase has its own |
| Server metrics | Coolify home page (CPU/RAM/disk of the VPS) |

## Troubleshooting

| Symptom | Fix |
|---|---|
| api deploy fails healthcheck | Open Logs. Usually missing env var (`[env] Missing X` at boot) or Supabase IP-blocked (`ECONNREFUSED`/timeout). |
| `CORS: origin … not allowed` in browser | Add the exact frontend origin to `CLIENT_URL` on the api app and redeploy. |
| Page loads but API calls hit `localhost:5000` | `VITE_API_URL` wasn't a **Build Variable** when web was built. Fix flag → redeploy web. |
| Real-time tracking not updating | Socket.io uses the same `VITE_API_URL` host; make sure it's the `https://api.…` domain. Traefik proxies WebSockets automatically. |
| 502 Bad Gateway | api container crashed or isn't listening on the injected `PORT`. Check Logs; don't hardcode `PORT`. |
| `sharp` install errors during build | Shouldn't happen (prebuilt binaries). If it does, check the build log for network issues to npm. |
| VPS runs out of RAM | Add swap: `fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`, then add to `/etc/fstab`. |
| Can't reach `http://VPS_IP:8000` | Open port 8000 in the Contabo firewall (only needed for dashboard access). |
