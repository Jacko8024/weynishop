import {
  ShoppingCart, Shirt, Smartphone, Home, Sparkles, Trophy, Baby,
  Gift, Sofa, Palette, LayoutGrid,
} from 'lucide-react';

/** Format a number as USD price, comma-grouped. */
export const fmtPrice = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

/** Compact thousands: 1203 -> "1.2K", 24000 -> "24K". */
export const fmtCompact = (n) => {
  const v = Number(n) || 0;
  if (v < 1000) return String(v);
  if (v < 10000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (v < 1_000_000) return Math.round(v / 1000) + 'K';
  return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
};

/** Pick the effective price for a product given the chosen quantity. */
export const effectivePrice = (product, qty = 1) => {
  if (product.flashSaleActive && product.flashSalePrice != null) return product.flashSalePrice;
  const tiers = (product.bulkPriceTiers || []).slice().sort((a, b) => b.minQty - a.minQty);
  const hit = tiers.find((t) => qty >= t.minQty);
  if (hit) return Number(hit.price);
  return Number(product.price);
};

export const CATEGORIES = [
  { key: 'grocery', label: 'Grocery', icon: ShoppingCart },
  { key: 'fashion', label: 'Fashion', icon: Shirt },
  { key: 'electronics', label: 'Electronics', icon: Smartphone },
  { key: 'home', label: 'Home', icon: Home },
  { key: 'beauty', label: 'Beauty', icon: Sparkles },
  { key: 'sports', label: 'Sports', icon: Trophy },
  { key: 'kids', label: 'Kids', icon: Baby },
  { key: 'gifts', label: 'Gifts', icon: Gift },
  { key: 'furniture', label: 'Furniture', icon: Sofa },
  { key: 'crafts', label: 'Crafts', icon: Palette },
  { key: 'general', label: 'Other', icon: LayoutGrid },
];

// Legacy keys from earlier seeds that were merged into 'kids'.
const LEGACY_KEYS = { children: 'kids' };

/**
 * Resolve a category key (including legacy/duplicate ones like 'children')
 * to { key, label, icon } with a lucide icon component. Used by findCategory
 * and anywhere a static mapping is needed.
 */
export const iconForCategory = (key) => {
  const resolved = LEGACY_KEYS[key] || key;
  return (
    CATEGORIES.find((c) => c.key === resolved) ||
    { key, label: key, icon: LayoutGrid }
  );
};
