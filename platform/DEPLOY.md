# Deployment guide

Frontend → **Vercel** (Vite/React static)
Backend  → **Render** (Express + Socket.IO)
Database → **Supabase** (Postgres + Storage; already provisioned)

The order matters: deploy the backend first so you have its public URL to give to Vercel.

---

## Part 1 — Backend on Render

### 1. Push to a Git host
Render deploys from GitHub/GitLab/Bitbucket. Make sure this repo is pushed to one of them.

### 2. Verify .gitignore
`.env` MUST be ignored. Already is (`platform/.gitignore` line 4). Confirm with:
```sh
git check-ignore platform/server/.env
```
It should print the path. If it prints nothing, **stop and fix that first** — your secrets are about to leak.

### 3. Create the Render service

Option A (recommended): **Blueprint**
1. https://dashboard.render.com/blueprints → **New blueprint**.
2. Connect your repo, branch `main`.
3. Render auto-detects `platform/server/render.yaml` and creates the service.
4. After creation, open the service → **Environment** → fill in every var marked "Sync: false" (see table below).
5. **Save & Deploy**.

Option B: **Manual web service**
1. https://dashboard.render.com → **New + → Web Service** → connect repo.
2. Settings:
   - **Root directory:** `platform/server`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/api/v1/health`
   - **Region:** Frankfurt (or whichever is nearest your Supabase project)
   - **Instance type:** Free is fine for testing; upgrade to Starter for production (free tier sleeps after 15 min idle and can take 30–60s to wake).
3. Add environment variables (see table below).
4. **Create web service**.

### 4. Environment variables

Copy from your local `platform/server/.env`. Don't paste real secrets into this file or anywhere committed.

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase **Transaction pooler** URI (port 6543, host contains `pooler.supabase.com`) |
| `DB_SSL` | `true` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role JWT |
| `SUPABASE_BUCKET_PRODUCTS` | `product-images` |
| `SUPABASE_BUCKET_BANNERS` | `banner-images` |
| `JWT_SECRET` | long random string (Render's "Generate" button works) |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | **set after Part 2** — your Vercel URL, e.g. `https://weynishop.vercel.app` (you can also CSV multiple, like `https://weynishop.vercel.app,https://weynishop.com`) |
| `STOREFRONT_URL` | same as `CLIENT_URL` (used in commission emails / receipts) |
| `GOOGLE_MAPS_API_KEY` | your Google Maps key |
| `FIREBASE_PROJECT_ID` | `weynishop` |
| `FIREBASE_CLIENT_EMAIL` | service-account email |
| `FIREBASE_PRIVATE_KEY` | full PEM with literal `\n`, wrapped in double-quotes |

### 5. Wait for the build
Logs should end with:
```
[db] connected: postgres://postgres.<ref>:***@aws-0-...pooler.supabase.com:6543/postgres
[api] listening on http://localhost:10000
```
Then `https://<your-service>.onrender.com/api/v1/health` returns `{"ok":true,...}`.

### 6. Note the public URL
You'll need it in Part 2. Looks like `https://weynishop-api.onrender.com`.

---

## Part 2 — Frontend on Vercel

### 1. Create the project
1. https://vercel.com/new → import your repo.
2. Settings:
   - **Framework preset:** Vite
   - **Root directory:** `platform/client`
   - **Build command:** `npm run build` (auto-detected)
   - **Output directory:** `dist` (auto-detected)
3. Add environment variables (see table below).
4. **Deploy**.

### 2. Environment variables

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://weynishop-api.onrender.com` (your Render URL — no trailing slash) |
| `VITE_GOOGLE_MAPS_API_KEY` | same Google Maps key as backend |
| `VITE_FIREBASE_API_KEY` | from Firebase Console → Project Settings → Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | `weynishop.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `weynishop` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `weynishop.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | from Firebase web app config |
| `VITE_FIREBASE_APP_ID` | from Firebase web app config |
| `VITE_FIREBASE_MEASUREMENT_ID` | optional |

(The Firebase ones already have working defaults baked into `src/lib/firebase.js`, but setting them explicitly via Vercel is cleaner.)

### 3. Verify SPA routing
`platform/client/vercel.json` rewrites every path to `/index.html`. Open
`https://<your-app>.vercel.app/seller/products` directly — it should NOT 404.

### 4. Update the backend's CORS allow-list
Go back to Render → your API service → **Environment** → set:
```
CLIENT_URL=https://<your-app>.vercel.app
```
(Or CSV multiple: `https://app.vercel.app,https://www.weynishop.com,http://localhost:5173` — localhost is useful for testing the prod backend from your dev frontend.)

Render will redeploy automatically. After that, the frontend can talk to the backend without CORS errors.

### 5. Whitelist the Vercel domain in Firebase
Firebase Console → **Authentication → Settings → Authorized domains** → **Add domain**:
- `<your-app>.vercel.app`
- your custom domain if any

Without this, Google sign-in popups will fail with `auth/unauthorized-domain`.

---

## Part 3 — Seed the production DB (one-time)

Run locally, pointed at the production DB:

```sh
cd platform/server
# Temporarily edit .env to use the same DATABASE_URL as Render, then:
npm run seed
```

Or run it once via Render's Shell tab: open the service → **Shell** → `node src/seed.js`.

⚠️  `seed.js` calls `sequelize.sync({ force: true })` which **drops and recreates every table**. Only run on first deploy or when you're OK losing all data.

---

## Operational notes

- **Free Render tier sleeps** after 15 minutes idle. First request after wake takes 30–60s. Upgrade to Starter ($7/mo) for always-on.
- **Socket.IO works on Render** out of the box — no extra config needed (long-polling falls back to websockets seamlessly).
- **Supabase Storage URLs are global CDN-cached** — uploads from any region serve fast worldwide.
- **Logs**: Render → service → Logs (real-time tail). Vercel → project → Deployments → click a deploy → Logs.

## Updating later

Both Vercel and Render auto-deploy on push to `main` (you can change to a different branch in their settings). Just `git push` and watch the dashboards.

## Custom domain

- **Vercel**: project → Settings → Domains → add your domain → set DNS at your registrar.
- **Render**: service → Settings → Custom Domains → add `api.yourdomain.com` → set DNS.
- After both, update `CLIENT_URL` (Render) and `VITE_API_URL` (Vercel) to use the custom domains.
