/** Format a number as ETB price, comma-grouped. */
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
  { key: 'grocery', label: 'Grocery', icon: '🛒' },
  { key: 'fashion', label: 'Fashion', icon: '👗' },
  { key: 'electronics', label: 'Electronics', icon: '📱' },
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'beauty', label: 'Beauty', icon: '💄' },
  { key: 'sports', label: 'Sports', icon: '⚽' },
  { key: 'kids', label: 'Kids', icon: '🧸' },
  { key: 'general', label: 'Other', icon: '🎁' },
];
