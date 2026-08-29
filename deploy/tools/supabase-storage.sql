-- Inspect storage buckets and objects to understand what data was uploaded.
SELECT id, name, public FROM storage.buckets;
SELECT bucket_id, count(*) FROM storage.objects GROUP BY bucket_id;
SELECT name, created_at FROM storage.objects WHERE bucket_id='product-images' ORDER BY created_at LIMIT 120;
