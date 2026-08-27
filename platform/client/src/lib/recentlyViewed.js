/**
 * Recently viewed products — minimal local history for the mobile home
 * section. Stored in localStorage; only the fields needed to render a
 * card are kept (no sensitive data).
 */

const KEY = 'weynshop:recentlyViewed';
const MAX = 8;

export const getRecentlyViewed = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const addRecentlyViewed = (product) => {
  if (!product?._id) return;
  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const entry = {
    _id: String(product._id),
    name: product.name || '',
    price: product.price,
    image: images[0] || '',
    flashSaleActive: !!product.flashSaleActive,
    flashSalePrice: product.flashSalePrice ?? null,
    flashSalePercent: product.flashSalePercent ?? null,
  };
  const next = [entry, ...getRecentlyViewed().filter((p) => p._id !== entry._id)].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* storage full/unavailable — ignore */ }
};