-- Check actual banner + avatar image URLs.
SELECT id, title, "imageUrl" FROM banners ORDER BY id;
SELECT id, "photoUrl" FROM users WHERE "photoUrl" IS NOT NULL AND "photoUrl" <> '' LIMIT 10;
SELECT id, "storeBanner" FROM users WHERE "storeBanner" IS NOT NULL AND "storeBanner" <> '' LIMIT 10;
SELECT id, "shopPhotoUrl", "tinOrLicenseUrl" FROM vendor_profiles;
