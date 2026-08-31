import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, MapPin, X, AlertCircle } from 'lucide-react';
import { suggestPlaces, resolveSuggestion } from '../lib/places.js';
import { useGoogleMaps } from '../lib/googleMapsLoader.js';
import { GOOGLE_MAPS_API_KEY } from '../api/client.js';

/**
 * Google Places Autocomplete (Places API — New).
 *
 * Replaces the legacy `@react-google-maps/api` <Autocomplete> widget:
 *  - Debounced (300 ms) — never one API call per keystroke
 *  - One session token per search → suggestion + details billed as a
 *    single Autocomplete session (see lib/places.js)
 *  - Place Details requests only the fields we use
 *  - Suggestions restricted to the 12 WeyniShop countries, biased toward
 *    `origin` (the user's last known / GPS position) when provided
 *
 * UX notes (mobile-first):
 *  - The dropdown is rendered INLINE (no createPortal): absolute inside a
 *    relative wrapper. No document-level outside-close handler — those
 *    caused the "tap does nothing" bug on the phone country selector.
 *    It closes on: pick, Escape, blur with no hover, or the ✕ button.
 *  - Every row is ≥ 48 px tall and closes on `onClick` (fires reliably on
 *    touch; mousedown-based handlers can race the touch event stream).
 *
 * Props:
 *  - onPick({ lat, lng, address, placeId }) — a resolved suggestion
 *  - onType(text)                            — raw typed text (manual entry)
 *  - origin {lat,lng}                        — location bias
 *  - value / defaultValue                    — controlled or free input
 *  - placeholder, className ('input' default)
 */

const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;

export default function AddressAutocomplete({
    onPick,
    onType,
    origin,
    value,
    defaultValue = '',
    placeholder,
    className = 'input',
}) {
    const { t } = useTranslation();
    const { isLoaded, loadError } = useGoogleMaps();

    const [internal, setInternal] = useState(defaultValue);
    const controlled = value !== undefined;
    const text = controlled ? value : internal;

    const [suggestions, setSuggestions] = useState([]);
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [failed, setFailed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const wrapRef = useRef(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const seqRef = useRef(0); // ignore stale async responses
    const blurTimeoutRef = useRef(null);

    const setText = useCallback(
        (next) => {
            if (!controlled) setInternal(next);
            onType?.(next);
        },
        [controlled, onType]
    );

    /* ---------------- debounced suggestion fetch ---------------- */
    const runSearch = useCallback(
        (query) => {
            const seq = ++seqRef.current;
            setBusy(true);
            setFailed(false);
            suggestPlaces(query, { origin })
                .then((rows) => {
                    if (seq !== seqRef.current) return; // a newer query superseded this
                    setSuggestions(rows);
                    setActiveIndex(-1);
                    setOpen(true);
                })
                .catch(() => {
                    if (seq !== seqRef.current) return;
                    setSuggestions([]);
                    setFailed(true);
                    setOpen(true);
                })
                .finally(() => {
                    if (seq === seqRef.current) setBusy(false);
                });
        },
        [origin]
    );

    const handleInput = useCallback(
        (e) => {
            const next = e.target.value;
            setSuggestions([]);
            setOpen(false);
            setFailed(false);
            clearTimeout(debounceRef.current);

            if (next.trim().length >= MIN_QUERY) {
                debounceRef.current = setTimeout(() => runSearch(next), DEBOUNCE_MS);
            }
            if (!controlled) setInternal(next);
            onType?.(next);
        },
        [controlled, onType, runSearch]
    );

    /* ---------------- pick a suggestion ---------------- */
    const pick = useCallback(
        async (suggestion) => {
            clearTimeout(debounceRef.current);
            setOpen(false);
            setSuggestions([]);
            setBusy(true);
            try {
                const resolved = await resolveSuggestion(suggestion);
                setSuggestions([]);
                if (!controlled) setInternal(resolved.address);
                onPick?.(resolved);
            } catch {
                setFailed(true);
            } finally {
                setBusy(false);
            }
        },
        [controlled, onPick]
    );

    /* ---------------- keyboard navigation ---------------- */
    const handleKeyDown = useCallback(
        (e) => {
            if (!open || !suggestions.length) {
                if (e.key === 'Enter') e.preventDefault(); // don't submit parent forms
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const idx = activeIndex >= 0 ? activeIndex : 0;
                pick(suggestions[idx]);
            } else if (e.key === 'Escape') {
                setOpen(false);
            }
        },
        [open, suggestions, activeIndex, pick]
    );

    /* ---------------- blur / outside close (mousedown-safe) ---------------- */
    // Focus leaving BOTH the wrapper and the dropdown closes it. Uses a short
    // timeout so the click that caused the blur still lands on the row first.
    const scheduleClose = useCallback(() => {
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = setTimeout(() => {
            if (!wrapRef.current?.contains(document.activeElement)) setOpen(false);
        }, 120);
    }, []);

    useEffect(
        () => () => {
            clearTimeout(debounceRef.current);
            clearTimeout(blurTimeoutRef.current);
        },
        []
    );

    /* ---------------- capability fallbacks ---------------- */
    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="relative" ref={wrapRef}>
                <input
                    ref={inputRef}
                    className={className}
                    placeholder={placeholder || t('addr.searchPh')}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    autoComplete="off"
                />
            </div>
        );
    }
    if (loadError) {
        return (
            <div className="relative">
                <input className={className} placeholder={t('addr.mapsFailed')} disabled />
            </div>
        );
    }

    const disabled = !isLoaded;
    const showDropdown = open && (busy || failed || suggestions.length > 0);

    return (
        <div className="relative" ref={wrapRef}>
            <div className="relative">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--color-muted)' }}
                />
                <input
                    ref={inputRef}
                    className={`${className} pl-9 ${text ? 'pr-9' : ''}`}
                    style={{ height: 48 }}
                    placeholder={placeholder || t('addr.searchPh')}
                    value={text}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        clearTimeout(blurTimeoutRef.current);
                        if (suggestions.length) setOpen(true);
                    }}
                    onBlur={scheduleClose}
                    disabled={disabled}
                    autoComplete="off"
                    enterKeyHint="search"
                    inputMode="search"
                />
                {busy && (
                    <Loader2
                        size={16}
                        className="animate-spin absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--color-muted)' }}
                    />
                )}
                {!busy && text && (
                    <button
                        type="button"
                        aria-label={t('common.clear') || 'Clear'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full active:bg-black/5"
                        onClick={() => {
                            setSuggestions([]);
                            setOpen(false);
                            setFailed(false);
                            setSuggestions([]);
                            setInternal('');
                            setText('');
                            inputRef.current?.focus();
                        }}
                    >
                        <X size={15} style={{ color: 'var(--color-muted)' }} />
                    </button>
                )}
            </div>

            {showDropdown && (
                <div
                    className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl overflow-hidden shadow-lg"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    {failed ? (
                        <div className="flex items-center gap-2 px-3.5 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                            <AlertCircle size={15} className="shrink-0" />
                            {t('addr.searchFailed')}
                        </div>
                    ) : busy && !suggestions.length ? (
                        <div className="flex items-center gap-2 px-3.5 py-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                            <Loader2 size={15} className="animate-spin" />
                            {t('addr.searching')}
                        </div>
                    ) : (
                        <ul role="listbox" className="max-h-72 overflow-y-auto overscroll-contain">
                            {suggestions.map((s, i) => {
                                const p = s.placePrediction;
                                if (!p) return null;
                                return (
                                    <li key={p.placeId || i} role="option" aria-selected={i === activeIndex}>
                                        <button
                                            type="button"
                                            className={`w-full text-left flex items-start gap-2.5 px-3.5 py-3 min-h-[48px] active:bg-black/5 ${i === activeIndex ? 'bg-black/[0.04]' : ''
                                                }`}
                                            // focus flows through the wrapper so blur-close logic works
                                            onFocus={() => clearTimeout(blurTimeoutRef.current)}
                                            onBlur={scheduleClose}
                                            onClick={() => pick(s)}
                                        >
                                            <MapPin size={15} className="mt-1 shrink-0" style={{ color: 'var(--color-muted)' }} />
                                            <span className="min-w-0">
                                                <span className="block text-sm font-medium leading-snug truncate">
                                                    {p.mainText?.text || p.text?.text}
                                                </span>
                                                {p.secondaryText?.text && (
                                                    <span
                                                        className="block text-xs leading-snug truncate"
                                                        style={{ color: 'var(--color-muted)' }}
                                                    >
                                                        {p.secondaryText.text}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
