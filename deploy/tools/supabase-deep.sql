-- Check Supabase auth users (real registrations) and storage objects.
SELECT count(*) AS auth_users FROM auth.users;
SELECT count(*) AS storage_objects FROM storage.objects;
SELECT id, email, created_at FROM auth.users ORDER BY created_at LIMIT 50;
