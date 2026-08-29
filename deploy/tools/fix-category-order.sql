-- Remove the duplicate 'children' category (merged into 'kids') and re-sequence.
UPDATE products SET category = 'kids' WHERE category = 'children';
DELETE FROM categories WHERE key = 'children';
UPDATE categories SET "displayOrder" = "displayOrder" - 1 WHERE "displayOrder" > 7;
SELECT id, key, label, "displayOrder" FROM categories ORDER BY "displayOrder";
