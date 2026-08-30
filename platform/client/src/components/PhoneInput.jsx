import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, Search } from 'lucide-react';
import { COUNTRIES, DEFAULT_COUNTRY, localDigits, isValidLocalPhone, toE164 } from '../lib/countries.js';

/**
 * Mobile phone input with country selector:
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
 */

export default function PhoneInput({ value = '', country: countryProp, onChange, error, id = 'phone', onFocus, onBlur, t: tProp }) {
    const { t } = useTranslation();
    const tr = tProp || t;
    const [country, setCountry] = useState(countryProp || DEFAULT_COUNTRY);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapRef = useRef(null);
    const searchRef = useRef(null);
    const local = localDigits(value, country);

    // Stay in sync when the parent swaps the country (controlled usage).
    useEffect(() => {
        if (countryProp && countryProp.code !== country.code) setCountry(countryProp);
    }, [countryProp]); // eslint-disable-line react-hooks/exhaustive-deps

    // Close the country sheet on outside tap / Escape.
    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    // Focus + reset the search box whenever the sheet opens.
    useEffect(() => {
        if (open) {
            setQuery('');
            // Wait a frame so the portal exists before focusing.
            requestAnimationFrame(() => searchRef.current?.focus());
        }
    }, [open]);

    // Search filter: match country name (any locale fallback: English name)
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

    return (
        <div className="relative" ref={wrapRef}>
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

                {/* National number — numeric keyboard, local formatting */}
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

            {/* Searchable country sheet */}
            {open &&
                createPortal(
                    <div className="fixed inset-0 z-[60] bg-black/40 animate-fadeIn" onClick={() => setOpen(false)}>
                        <div
                            className="absolute bottom-0 inset-x-0 rounded-t-2xl overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
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
                                                onClick={() => {
                                                    setCountry(c);
                                                    setOpen(false);
                                                    emit(c, local.slice(0, c.maxLength)); // re-validate for new country
                                                }}
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
