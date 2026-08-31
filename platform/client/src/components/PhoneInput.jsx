import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, Search } from 'lucide-react';
import { COUNTRIES, DEFAULT_COUNTRY, localDigits, isValidLocalPhone, toE164 } from '../lib/countries.js';

/**
 * Phone input with country selector:
 *
 *   ┌───────────────────────────────┐
 *   │ 🇪🇹 +251 ▾ │ 9XX XXX XXX       │
 *   └───────────────────────────────┘
 *
 * - Numeric keyboard (inputMode="numeric")
 * - Local-part formatting per country (single source: lib/countries.js)
 * - The dial code is shown as a fixed prefix chip → it can never be typed
 *   twice, and the value sent to the backend is always normalized E.164.
 * - Searchable country sheet (12 supported countries) — filter by country
 *   name or dial code.
 * - Controlled via onChange({ country, local, e164, valid })
 *
 * ── MOBILE TAP FIX ──
 * The sheet is rendered via createPortal(document.body) so it escapes any
 * overflow-hidden ancestor. The old version closed the sheet on a
 * document-level `mousedown` that checked wrapRef.contains(target) — but
 * the PORTAL lives outside wrapRef, so the FIRST touch on a country row
 * (touch devices emit mousedown→mouseup→click) closed the sheet before the
 * click event could reach the button. Selection silently did nothing: the
 * "countries are not selectable" bug. Fixed by closing ONLY on taps that
 * hit the backdrop itself / Escape / after a row is chosen.
 */

export default function PhoneInput({ value = '', country: countryProp, onChange, error, id = 'phone', onFocus, onBlur, t: tProp }) {
    const { t } = useTranslation();
    const tr = tProp || t;
    const [country, setCountry] = useState(countryProp || DEFAULT_COUNTRY);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const searchRef = useRef(null);
    const local = localDigits(value, country);

    // Stay in sync when the parent swaps the country (controlled usage).
    useEffect(() => {
        if (countryProp && countryProp.code !== country.code) setCountry(countryProp);
    }, [countryProp]); // eslint-disable-line react-hooks/exhaustive-deps

    // Close the sheet on Escape only — backdrop taps are handled by the
    // backdrop element itself (see the onClick on the overlay), so taps on
    // country rows can never be mistaken for "outside" taps.
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    // Focus + reset the search box whenever the sheet opens.
    useEffect(() => {
        if (open) {
            setQuery('');
            // Wait a frame so the portal exists before focusing.
            requestAnimationFrame(() => searchRef.current?.focus());
        }
    }, [open]);

    // Search filter: match country name (English name — any-locale fallback)
    // or dial code, case-insensitive. Empty query → full list.
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return COUNTRIES;
        return COUNTRIES.filter(
            (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q) || c.code.toLowerCase() === q
        );
    }, [query]);

    const emit = (nextCountry, nextLocal) => {
        onChange?.({
            country: nextCountry,
            local: nextLocal,
            e164: toE164(nextLocal, nextCountry),
            valid: isValidLocalPhone(nextLocal, nextCountry),
        });
    };

    const pick = (c) => {
        setCountry(c);
        setOpen(false);
        // Keep typed digits (truncated to the new country's length) and
        // re-validate for the new rules — e.g. selecting 🇸🇦 +966 while
        // "911234567" is typed truncates/revalidates against /^5\d{8}$/.
        emit(c, local.slice(0, c.maxLength));
    };

    return (
        <div className="relative">
            <div
                className={`flex items-stretch overflow-hidden rounded-lg focus-within:ring-2 ${error ? 'border-red-300' : ''}`}
                style={{
                    border: `1px solid ${error ? '#fca5a5' : 'var(--color-border)'}`,
                    background: 'var(--color-surface)',
                    '--tw-ring-color': 'var(--color-brand)',
                }}
            >
                {/* Country selector button */}
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="flex items-center gap-1 px-3 h-12 text-sm font-semibold select-none shrink-0"
                    style={{ borderRight: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
                    aria-label={tr('auth.chooseCountry')}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                >
                    <span aria-hidden="true">{country.flag}</span>
                    <span>{country.dialCode}</span>
                    <ChevronDown size={14} style={{ color: 'var(--color-muted)' }} />
                </button>

                {/* National number — numeric keyboard, local formatting.
                    The dial code is a fixed prefix chip: the field shows
                    "+966 | 5XX XXX XXX" semantics and E.164 goes to the API. */}
                <input
                    id={id}
                    className="flex-1 min-w-0 h-12 px-3 text-base tracking-wide focus:outline-none"
                    style={{ background: 'transparent', color: 'var(--color-text)' }}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder={country.placeholder}
                    value={country.format(local)}
                    onChange={(e) => emit(country, e.target.value.replace(/\D/g, ''))}
                    onFocus={onFocus}
                    onBlur={onBlur}
                />
            </div>

            {/* Searchable country sheet — portal escapes overflow clipping.
                The overlay closes ONLY on a direct tap on itself (never on
                bubbling events), so country-row taps always register. */}
            {open &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[60] bg-black/40 animate-fadeIn"
                        onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
                    >
                        <div
                            className="absolute bottom-0 inset-x-0 rounded-t-2xl overflow-hidden flex flex-col"
                            role="listbox"
                            aria-label={tr('auth.chooseCountry')}
                            style={{
                                background: 'var(--color-surface)',
                                paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                                maxHeight: '80vh',
                            }}
                        >
                            <div className="px-4 py-3 font-bold text-[15px] flex items-center justify-between"
                                style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {tr('auth.chooseCountry')}
                                <span className="text-xs font-normal" style={{ color: 'var(--color-muted)' }}>
                                    {filtered.length}/{COUNTRIES.length}
                                </span>
                            </div>

                            {/* Search box */}
                            <div className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <div
                                    className="flex items-center gap-2 h-10 px-3 rounded-full"
                                    style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
                                >
                                    <Search size={15} style={{ color: 'var(--color-muted)' }} />
                                    <input
                                        ref={searchRef}
                                        type="search"
                                        className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none"
                                        style={{ color: 'var(--color-text)' }}
                                        placeholder={tr('auth.searchCountry')}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* Scrollable list */}
                            <ul className="overflow-y-auto overscroll-contain">
                                {filtered.map((c) => {
                                    const active = c.code === country.code;
                                    return (
                                        <li key={c.code}>
                                            <button
                                                type="button"
                                                role="option"
                                                aria-selected={active}
                                                onClick={() => pick(c)}
                                                className="w-full flex items-center justify-between px-4 py-3.5 text-left press"
                                            >
                                                <span className="flex items-center gap-3 min-w-0">
                                                    <span className="text-xl" aria-hidden="true">{c.flag}</span>
                                                    <span className="text-[15px] font-medium truncate" style={{ color: 'var(--color-text)' }}>{c.name}</span>
                                                </span>
                                                <span className="flex items-center gap-2 shrink-0 pl-2">
                                                    <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{c.dialCode}</span>
                                                    {active && <Check size={18} style={{ color: 'var(--color-brand)' }} />}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                                {!filtered.length && (
                                    <li className="px-4 py-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                                        {tr('auth.noCountryMatch')}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
