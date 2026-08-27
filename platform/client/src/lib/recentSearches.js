const KEY = 'weynshop:recentSearches';
const MAX = 8;

export const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

export const addRecentSearch = (q) => {
  const term = String(q || '').trim();
  if (!term) return;
  const next = [term, ...getRecentSearches().filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
};

export const clearRecentSearches = () => localStorage.removeItem(KEY);
