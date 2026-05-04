# Supabase migration guide

## 1. Create the Supabase project

1. https://supabase.com/dashboard → **New project**.
2. Name: `weynishop` (or whatever); pick a region close to you; set a strong DB password.
3. Wait for provisioning (~2 min).

## 2. Get connection credentials

In the dashboard:

- **Settings → Database → Connection string → URI** (Pooler tab → port 6543)
  → put into `DATABASE_URL`
- **Settings → API**
  - `Project URL` → `SUPABASE_URL`
  - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Create the storage buckets

In the dashboard → **Storage → New bucket**:

| Bucket name      | Public | Notes                                       |
|------------------|--------|---------------------------------------------|
| `product-images` | ✅ Yes | Seller product photos (cover-cropped 800×800)|
| `banner-images`  | ✅ Yes | Admin banners (cover-cropped 1600×600)       |

Click each → **Edit** → make sure **Public bucket** is on.
(If you keep them private, the public URLs `getPublicUrl()` returns will 404.)

## 4. Configure server env

```sh
cd platform/server
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux
```

Edit `.env` with the values from step 2.

## 5. Install dependencies

```sh
cd platform/server
npm install
```

(`pg`, `pg-hstore`, and `@supabase/supabase-js` are already in `package.json`;
`mysql2` was removed.)

## 6. Create the schema + seed data

The schema is created automatically by Sequelize on first boot. To get a clean
populated DB:

```sh
npm run seed   # drops and recreates ALL tables, then inserts demo accounts/products
```

Demo accounts printed in the seed output (passwords: `Admin@123`, `Seller@123`, etc.)

Then start the server:

```sh
npm run dev
```

Boot output should show:
```
[db] connected: postgres://postgres:***@aws-0-...
[api] listening on http://localhost:5000
```

## 7. Row-Level Security (optional)

This codebase keeps custom JWT auth — RLS is **not required** for the API to
work, because Sequelize connects with the service-role-equivalent Postgres user
which bypasses RLS by default. If you also want to allow direct browser access
to the DB via the Supabase JS client (e.g. for Realtime subscriptions), enable
RLS on every table and add policies. Keep RLS **off** for tables only the API
touches.

## What changed in the codebase

| Area | Before | After |
|------|--------|-------|
| DB driver | `mysql2` | `pg` + `pg-hstore` |
| Dialect | MySQL | Postgres |
| `INTEGER.UNSIGNED` columns | yes | replaced with `INTEGER` (Postgres has no unsigned) |
| Search filters | `Op.like` | `Op.iLike` (case-insensitive on PG) |
| Image storage | local disk + `/uploads` static route | Supabase Storage public buckets |
| `app.use('/uploads', …)` | served via Express | removed (URLs are absolute Supabase URLs) |

## Rollback

The MySQL adapter was uninstalled. To go back, run
`npm uninstall pg pg-hstore @supabase/supabase-js && npm install mysql2`,
restore the previous `db.js` / `env.js`, and re-add `INTEGER.UNSIGNED` in the models.
