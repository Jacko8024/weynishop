# Deploying WeyniShop on Coolify (Contabo VPS)

Self-hosted deployment of the full platform on your own VPS using
[Coolify](https://coolify.io) (open-source Heroku/Vercel alternative).

## Architecture

```
                        ┌──────────────────────────────────────────────┐
 Internet ──HTTPS──►    │  Contabo VPS (Coolify + Traefik proxy)       │
                        │                                              │
  www.yourdomain.com ──►│  web       : nginx + React build (port 80)   │
  api.yourdomain.com ──►│  api       : Node/Express+Socket.io (3000)   │
                        │              └── /app/uploads (volume)       │
                        │                        │ private network     │
                        │  postgres  : Coolify-managed PostgreSQL 16   │
                        └──────────────────────────────────────────────┘
```

| Piece | Where it runs | Notes |
|---|---|---|
| **web** (React/Vite) | Coolify app, nginx container | `platform/client/Dockerfile` |
| **api** (Express + Socket.io) | Coolify app, Node 20 container | `platform/server/Dockerfile` |
| **Database** | Coolify-managed PostgreSQL 16 | Private network, `DB_SSL=false` |
| **Image storage** | Local disk in the api container | Persistent volume mounted at `/app/uploads` |

Everything runs on your VPS — **no Supabase or any other external service is
required**. The web container is stateless; the api container writes uploaded
images/documents to a persistent volume, so redeploys never lose files.

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

No external services are needed: the database is a Coolify-managed PostgreSQL
on the same VPS and uploaded images are stored on a persistent volume.

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

## Step 4 — Create the database (Coolify-managed PostgreSQL)

1. Project → **+ New Resource** → **Database** → **PostgreSQL 16**.
2. Name it **`postgres`** (or keep the generated name) and start it.
3. Once it's running, open the resource → **Connection** and copy the
   **Internal connection URL**. It looks like:

   ```
   postgres://<user>:<password>@<resource-name>:5432/<dbname>
   ```

   Keep this handy — it becomes `DATABASE_URL` for the api app. The internal
   URL is only reachable inside Coolify's private Docker network, which is
   exactly what we want (the DB is never exposed to the internet).

> Optional but recommended: resource → **Scheduled Backups** → add a daily
> backup (to local disk, or S3-compatible storage if you have any).

---

## Step 5 — Create the API application

1. Project → **+ New Resource** → **Application**.
2. Choose your GitHub source → `Jacko8024/weynishop` → branch `main`.
3. Name it **`api`**.
4. Configuration (the app is auto-detected as *Dockerfile*; verify):
   - **Build Pack:** `Dockerfile`
   - **Base Directory:** `platform/server`
   - **Dockerfile Location:** `Dockerfile`
   - **Ports Exposed:** `3000`
   - **Health Check:** method GET, path `/api/v1/health`, port `3000`
5. **Persistent Storage** (app → **Storages** → **+ Add**):
   - **Name:** `api-uploads`
   - **Mount Path:** `/app/uploads`
   - Type: *Volume* (Coolify creates a Docker volume). The Dockerfile
     pre-creates `/app/uploads` owned by the non-root `node` user, so a fresh
     volume inherits the correct ownership on first mount.
   - ⚠️ Without this volume, uploaded images are lost on every redeploy.
6. **Domains** → add `https://api.yourdomain.com`
   (Coolify's Traefik will issue a Let's Encrypt certificate automatically.
   DNS must already point at the VPS.)
7. **Environment Variables** → add all of these:

| Variable | Value |
|---|---|
| `DATABASE_URL` | the **internal** URL from Step 4 (`postgres://<user>:<pw>@<resource-name>:5432/<db>`) |
| `DB_SSL` | `false` |
| `UPLOADS_DIR` | `/app/uploads` |
| `PUBLIC_API_URL` | `https://api.yourdomain.com` (used to build image URLs) |
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

8. Click **Deploy**. Watch **Logs** until you see:

```
[db] connected: postgres://<user>:***@<resource-name>:5432/<db>
[api] listening on http://localhost:3000
```

9. Verify: `https://api.yourdomain.com/api/v1/health` → `{"ok":true,...}`

---

## Step 6 — Create the Web application

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
| `VITE_API_URL` | `https://api.yourdomain.com` (your Step 5 URL, no trailing slash) | ✅ yes |
| `VITE_GOOGLE_MAPS_API_KEY` | same Maps key | ✅ yes |
| `VITE_STOREFRONT_URL` | `https://www.yourdomain.com` | ✅ yes |
| `VITE_FIREBASE_*` | optional — defaults are baked into `src/lib/firebase.js` | ✅ yes if set |

6. Click **Deploy**. The build fails fast with a clear error if
   `VITE_API_URL` is missing.
7. When it's healthy, open your domain — the shop should load. Test SPA
   routing directly: `https://www.yourdomain.com/login` must not 404.

---

## Step 7 — Wire CORS (if you didn't already)

Back on the **api** app → Environment Variables → make sure:

```
CLIENT_URL=https://www.yourdomain.com,https://yourdomain.com
```

Redeploy the api app. Without this, browser requests fail with CORS errors.


---

## Step 8 — Seed data (first deploy only, optional)

The API auto-runs safe migrations/backfills on every boot. If you need the
demo seed (⚠️ `seed.js` uses `sync({force:true})` — it **drops all tables**):

1. Coolify → **api** app → **Terminal** (opens a shell in the container).
2. Run: `node src/seed.js` (or `node src/seed-bulk.js` for the bulk catalog).

On a fresh Coolify database the tables are created automatically on first
boot — seeding demo accounts is entirely optional.

---

## Step 9 — External service whitelists

- **Firebase** (Google sign-in): Firebase Console → Authentication → Settings
  → **Authorized domains** → add `www.yourdomain.com` and `yourdomain.com`.
- **Google Maps key**: if you restrict by HTTP referrer, add
  `https://www.yourdomain.com/*` and `https://yourdomain.com/*`.

That's it — the database and image storage are fully self-hosted on the VPS.

---

## Optional — Migrating existing data from Supabase

If you already have real data in a Supabase project and want to bring it over:

1. **Database** (from your PC):
   ```bash
   pg_dump "postgres://postgres.<ref>:<pw>@db.<ref>.supabase.co:5432/postgres" -Fc -f weynishop.dump
   ```
   Upload the dump to the VPS (`scp weynishop.dump root@VPS_IP:/tmp/`), then
   restore it into the Coolify Postgres container:
   ```bash
   docker cp /tmp/weynishop.dump <pg-container>:/tmp/
   docker exec <pg-container> pg_restore -U <user> -d <dbname> --clean /tmp/weynishop.dump
   ```
   (Find the container name with `docker ps` on the VPS.)
2. **Images**: rows in the old DB reference absolute `https://<ref>.supabase.co/storage/...`
   URLs. Those keep working as long as the Supabase project exists. To move
   them fully, download the bucket contents and re-upload through the API
   (or copy files into the `/app/uploads` volume and rewrite the URL columns).
   For a fresh start, simply re-upload product images through the seller portal.

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
| Backups | Coolify → DB resource → **Scheduled Backups** (daily recommended) |
| Uploaded files | live in the `api-uploads` volume — include them in your backup plan |
| Server metrics | Coolify home page (CPU/RAM/disk of the VPS) |

## Troubleshooting

| Symptom | Fix |
|---|---|
| api deploy fails healthcheck | Open Logs. Usually a missing env var (`[env] Missing X` at boot) or a wrong `DATABASE_URL` (`ECONNREFUSED`). Make sure you used the **internal** Postgres URL and both resources are in the same project/network. |
| Uploads fail with `EACCES` / permission denied | The volume isn't owned by the `node` user. One-time fix on the VPS: `docker exec -u root <api-container> chown -R node:node /app/uploads`, then redeploy. |
| Uploaded images 404 | Check `PUBLIC_API_URL` matches the api domain exactly (no trailing slash) and the `/app/uploads` volume is attached. |
| `CORS: origin … not allowed` in browser | Add the exact frontend origin to `CLIENT_URL` on the api app and redeploy. |
| Page loads but API calls hit `localhost:5000` | `VITE_API_URL` wasn't a **Build Variable** when web was built. Fix flag → redeploy web. |
| Real-time tracking not updating | Socket.io uses the same `VITE_API_URL` host; make sure it's the `https://api.…` domain. Traefik proxies WebSockets automatically. |
| 502 Bad Gateway | api container crashed or isn't listening on the injected `PORT`. Check Logs; don't hardcode `PORT`. |
| `sharp` install errors during build | Shouldn't happen (prebuilt binaries). If it does, check the build log for network issues to npm. |
| VPS runs out of RAM | Add swap: `fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`, then add to `/etc/fstab`. |
| Can't reach `http://VPS_IP:8000` | Open port 8000 in the Contabo firewall (only needed for dashboard access). |
