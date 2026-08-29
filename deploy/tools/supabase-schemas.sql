-- Check all schemas for tables, and look for any users/products data anywhere.
SELECT table_schema, table_name FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog','information_schema','supabase_functions','net','cron','graphql','graphql_public','vault','realtime','storage','supabase_kicks','pgsodium','pgsodium_masks','extensions','auth','analytics')
ORDER BY 1,2;
-- Any user rows beyond demo?
SELECT id, email, role, "createdAt" FROM public.users ORDER BY id;
