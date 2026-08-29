-- Compare products between Supabase source and local production DB.
SELECT id, name, category, price, "isActive", "sellerId" FROM products ORDER BY id;
SELECT id, name, emoji, "displayOrder" FROM categories ORDER BY "displayOrder";
