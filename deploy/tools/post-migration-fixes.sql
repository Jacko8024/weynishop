-- Post-migration fixes after restoring weynishop_dump_fixed.sql
-- 1. Disable RLS on all tables (Supabase legacy; API connects as superuser but
--    keep it clean for Coolify-managed PG).
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- 2. Re-apply the Kids/Children category dedupe (children merged into kids).
UPDATE products SET category='kids' WHERE category='children';
DELETE FROM categories WHERE key='children';
UPDATE categories SET "displayOrder" = "displayOrder" - 1 WHERE "displayOrder" > 7 AND key <> 'general';
UPDATE categories SET "displayOrder" = 99 WHERE key='general';

-- 3. Fix sequences (dump sets them via setval, but verify they're ahead of max id).
SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT MAX(id) FROM users),1));
SELECT setval(pg_get_serial_sequence('products','id'), COALESCE((SELECT MAX(id) FROM products),1));
SELECT setval(pg_get_serial_sequence('categories','id'), COALESCE((SELECT MAX(id) FROM categories),1));
SELECT setval(pg_get_serial_sequence('vendor_profiles','id'), COALESCE((SELECT MAX(id) FROM vendor_profiles),1));
SELECT setval(pg_get_serial_sequence('banners','id'), COALESCE((SELECT MAX(id) FROM banners),1));
SELECT setval(pg_get_serial_sequence('reviews','id'), COALESCE((SELECT MAX(id) FROM reviews),1));
SELECT setval(pg_get_serial_sequence('surprise_services','id'), COALESCE((SELECT MAX(id) FROM surprise_services),1));
SELECT setval(pg_get_serial_sequence('wishlists','id'), COALESCE((SELECT MAX(id) FROM wishlists),1));

-- 4. Summary
SELECT 'users' t, count(*) FROM users
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'vendor_profiles', count(*) FROM vendor_profiles
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'banners', count(*) FROM banners
UNION ALL SELECT 'reviews', count(*) FROM reviews
UNION ALL SELECT 'surprise_services', count(*) FROM surprise_services;
