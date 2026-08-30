import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check } from 'lucide-react';
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
 * - Controlled via onChange({ country, local, e164, valid })
 */

export default function PhoneInput({ value = '', country: countryProp, onChange, error, id = 'phone', onFocus, onBlur, t: tProp }) {
    const { t } = useTranslation();
    const tr = tProp || t;
    const [country, setCountry] = useState(countryProp || DEFAULT_COUNTRY);
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
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

            {/* Country dropdown */}
            {open &&
                createPortal(
                    <div className="fixed inset-0 z-[60] bg-black/40 animate-fadeIn" onClick={() => setOpen(false)}>
                        <div
                            className="absolute bottom-0 inset-x-0 rounded-t-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            role="listbox"
                            aria-label={tr('auth.chooseCountry')}
                            style={{ background: 'var(--color-surface)', paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
                        >
                            <div className="px-4 py-3 font-bold text-[15px]" style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {tr('auth.chooseCountry')}
                            </div>
                            <ul>
                                {COUNTRIES.map((c) => {
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
                                                <span className="flex items-center gap-3">
                                                    <span className="text-xl" aria-hidden="true">{c.flag}</span>
                                                    <span className="text-[15px] font-medium" style={{ color: 'var(--color-text)' }}>{c.name}</span>
                                                    <span className="text-sm" style={{ color: 'var(--color-muted)' }}>{c.dialCode}</span>
                                                </span>
                                                {active && <Check size={18} style={{ color: 'var(--color-brand)' }} />}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
}
