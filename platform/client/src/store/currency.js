import { create } from 'zustand';
import { api } from '../api/client.js';

/**
 * Display-currency store (spec §17–§19).
 *
 * - Rates come ONLY from the admin-controlled server table via
 *   GET /config/currency — never hardcoded, never third-party.
 * - All product/order amounts are stored in the BASE currency (ETB).
 *   convert() turns a base amount into the user's chosen display currency.
 * - The choice persists in localStorage ("weynishop:currency") and is a
 *   DISPLAY concern only — orders are always placed in ETB.
 */

const KEY = 'weynishop:currency';
const BASE = 'ETB';

const load = () => {
    try { return localStorage.getItem(KEY) || BASE; } catch { return BASE; }
};

export const useCurrency = create((set, get) => ({
    base: BASE,
    // code -> { code, name, symbol, rateToBase, decimals }
    rates: { [BASE]: { code: BASE, name: 'Ethiopian Birr', symbol: 'ETB', rateToBase: 1, decimals: 2 } },
    currencies: [BASE],
    loaded: false,
    current: load(),

    /** Fetch the admin-controlled rate table (called once at app boot). */
    loadRates: async () => {
        try {
            const { data } = await api.get('/config/currency');
            const rates = {};
            for (const c of data.currencies || []) rates[c.code] = c;
            // Base fallback so the app keeps working before the first admin save.
            if (!rates[BASE]) rates[BASE] = { code: BASE, name: 'Ethiopian Birr', symbol: 'ETB', rateToBase: 1, decimals: 2 };
            const codes = Object.keys(rates);
            const current = codes.includes(get().current) ? get().current : BASE;
            set({ base: data.base || BASE, rates, currencies: codes, loaded: true, current });
        } catch {
            // Offline / API down → keep defaults; UI still works in ETB.
            set({ loaded: true });
        }
    },

    /** Switch the display currency (persisted). */
    setCurrency: (code) => {
        if (!get().rates[code]) return;
        try { localStorage.setItem(KEY, code); } catch { /* private mode */ }
        set({ current: code });
    },

    /**
     * Convert a base-currency (ETB) amount into the current display currency.
     * rateToBase semantics: 1 unit of currency = rateToBase ETB
     * → amount_in_currency = amount_etb / rateToBase.
     */
    convert: (amountEtb) => {
        const { rates, current } = get();
        const c = rates[current] || rates[BASE];
        const v = Number(amountEtb) || 0;
        return v / (c.rateToBase || 1);
    },

    /** Get conversion info for an arbitrary currency code (admin preview). */
    convertTo: (amountEtb, code) => {
        const { rates } = get();
        const c = rates[code] || rates[BASE];
        return (Number(amountEtb) || 0) / (c.rateToBase || 1);
    },
}));

/**
 * Format a converted amount for display, honouring per-currency decimals
 * (LBP shows none — spec §17) and grouping.
 */
export const fmtCurrency = (amountEtb, { currency, rates, current } = {}) => {
    const c = currency || rates?.[current] || null;
    const decimals = c ? c.decimals : 2;
    const symbol = c ? c.symbol : current;
    const v = Number(amountEtb) || 0;
    const num = v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return c && c.symbol && c.symbol !== c.code ? `${num} ${c.symbol}` : `${num} ${c.code || 'ETB'}`;
};

/**
 * Reactive price formatter for customer-facing components (spec §20/§21).
 *
 *   const price = usePrice();
 *   price.fmt(1000)   →  "1,000 ETB"      (base)
 *                    →  "$6.67"          (USD)
 *                    →  "24.51 AED"      (AED)
 *                    →  "625,000 LBP"    (LBP, 0 decimals)
 *
 * Formatting rules (from the spec examples): single-character symbols ($)
 * are prefixed; everything else suffixes the ISO code. Conversion uses the
 * admin-controlled rateToBase (amount / rateToBase).
 */
export const usePrice = () => {
    const current = useCurrency((s) => s.current);
    const rates = useCurrency((s) => s.rates);
    const c = rates[current] || rates[BASE];

    const fmt = (amountEtb) => {
        const v = (Number(amountEtb) || 0) / (c.rateToBase || 1);
        const dec = c.decimals ?? 2;
        const num = v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
        return c.symbol && c.symbol.length === 1 ? `${c.symbol}${num}` : `${num} ${c.code}`;
    };

    return { code: current, symbol: c.symbol, fmt };
};

export const CURRENCY_BASE = BASE;
