import { useEffect, useSyncExternalStore } from 'react';
import { api } from '../api/client.js';
import { CATEGORIES as FALLBACK, iconForCategory } from './format.js';

// Lightweight global cache so multiple components share a single fetch.
let categories = null;        // null = not loaded yet
let inflight = null;
const listeners = new Set();
const subscribe = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };
const snapshot = () => categories;
const emit = () => listeners.forEach((cb) => cb());

const fetchCategories = () => {
  if (inflight) return inflight;
  inflight = api.get('/categories')
    .then(({ data }) => {
      // Map the API rows onto our hard-coded list: lucide icon component
      // (matched by key), server label, server id. Keys not present in the
      // static list fall back to the generic grid icon.
      const byKey = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
      const items = (data.items || [])
        // Skip duplicate/legacy keys (e.g. 'children' merged into 'kids').
        .filter((c) => byKey[c.key])
        .map((c) => ({
          key: c.key,
          label: c.label,
          icon: byKey[c.key].icon,
          _id: c._id || String(c.id),
        }));
      // If the API returns nothing yet (fresh install), fall back to the
      // hard-coded list so the storefront still renders something useful.
      categories = items.length ? items : FALLBACK;
      emit();
      return categories;
    })
    .catch(() => {
      categories = FALLBACK;
      emit();
      return categories;
    })
    .finally(() => { inflight = null; });
  return inflight;
};

/** Hook used by storefront pages — fetches once, cached across mounts. */
export const useCategories = () => {
  const value = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => { if (categories === null) fetchCategories(); }, []);
  return value || FALLBACK;
};

/** Force a refresh — used by the admin Categories page after mutations. */
export const refreshCategories = () => {
  categories = null;
  inflight = null;
  return fetchCategories();
};

/** Resolve a category key → { label, icon } using cached list (sync). */
export const findCategory = (key) =>
  (categories || FALLBACK).find((c) => c.key === key) || iconForCategory(key);
