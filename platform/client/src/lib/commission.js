import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

let cachedPercent = null;
let inflight = null;

const fetchPercent = () => {
  if (inflight) return inflight;
  inflight = api.get('/config/public')
    .then(({ data }) => {
      cachedPercent = Number(data.commissionPercent) || 0;
      return cachedPercent;
    })
    .catch(() => {
      cachedPercent = 0;
      return 0;
    })
    .finally(() => { inflight = null; });
  return inflight;
};

/**
 * useCommissionPercent — returns the platform's buyer-facing commission %.
 * Used by the seller "new product" form to compute the live final-price preview.
 */
export const useCommissionPercent = () => {
  const [pct, setPct] = useState(cachedPercent ?? 0);
  useEffect(() => {
    if (cachedPercent !== null) {
      setPct(cachedPercent);
      return;
    }
    let on = true;
    fetchPercent().then((v) => { if (on) setPct(v); });
    return () => { on = false; };
  }, []);
  return pct;
};
