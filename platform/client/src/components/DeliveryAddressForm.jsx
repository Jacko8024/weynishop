import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
    MapPin,
    Search,
    Check,
    Building2,
    Home,
    Phone,
    MessageSquare,
    Loader2,
    Navigation2,
} from 'lucide-react';
import MapView from './MapView.jsx';
import AddressAutocomplete from './AddressAutocomplete.jsx';
import GeolocationButton from './GeolocationButton.jsx';
import PhoneInput from './PhoneInput.jsx';
import { reverseGeocode } from '../lib/places.js';
import { detectCountry } from '../lib/countries.js';
import { GOOGLE_MAPS_API_KEY } from '../api/client.js';

/**
 * Full delivery-address form — the professional flow requested for the
 * mobile app (also usable on the website):
 *
 *   ┌──────────────────────────────────────────┐
 *   │ 📍 Add delivery address                  │
 *   │ [ 🔍 Search address…            ]        │
 *   │ ──────────────── or ────────────────      │
 *   │ [ ⊕ Use my current location ]            │
 *   ├──────────────────────────────────────────┤
 *   │ Selected address ( Places result / GPS ) │
 *   │ [ small map preview with pin ]           │
 *   ├──────────────────────────────────────────┤
 *   │ Apartment / house number  [____]         │
 *   │ Building / landmark       [____]         │
 *   │ Delivery instructions     [____]         │
 *   │ Contact phone  [🇪🇹+251|______]          │
 *   ├──────────────────────────────────────────┤
 *   │ [ ✓ Confirm address ]                    │
 *   └──────────────────────────────────────────┘
 *
 * Data flow:
 *  - Search      → AddressAutocomplete → Places (New) session →
 *                  { lat, lng, address }
 *  - GPS         → getCurrentLocation → reverseGeocode → readable address.
 *                  On permission denial the GeolocationButton toasts a
 *                  friendly message and manual search stays available —
 *                  checkout is NEVER blocked.
 *  - "approximate" GPS results (geocoder had no match) show a hint asking
 *    the user to add street details in the fields below.
 *
 * Output — `onConfirm(payload)`:
 *   {
 *     lat, lng, address,                    // required
 *     apartment, building, instructions,    // extra detail (optional)
 *     contactPhone,                         // E.164 or ''
 *   }
 *
 * Props:
 *  - initial       — { lat,lng,address,apartment,building,instructions,contactPhone }
 *  - onConfirm(payload) — called after local validation
 *  - submitLabel   — CTA text (default: addr.confirm)
 *  - pending       — disables CTA while the parent saves
 *  - compact       — tighter paddings for checkout embedding
 */

const Field = ({ icon: Icon, label, children, required }) => (
    <label className="block">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-muted)' }}>
            {Icon && <Icon size={13} />}
            {label}
            {required && <span style={{ color: 'var(--color-brand)' }}>*</span>}
        </span>
        {children}
    </label>
);

export default function DeliveryAddressForm({ initial, onConfirm, submitLabel, pending = false, compact = false }) {
    const { t } = useTranslation();

    const [pin, setPin] = useState(
        initial?.lat && initial?.lng
            ? { lat: Number(initial.lat), lng: Number(initial.lng) }
            : null
    );
    const [address, setAddress] = useState(initial?.address || '');
    const [apartment, setApartment] = useState(initial?.apartment || '');
    const [building, setBuilding] = useState(initial?.building || '');
    const [instructions, setInstructions] = useState(initial?.instructions || '');
    const [approximate, setApproximate] = useState(false);
    const [busyLocate, setBusyLocate] = useState(false);

    // PhoneInput is fully controlled — it derives its display from `value`
    // on every render, so the local digits must be live state (a frozen
    // memo here would swallow every keystroke).
    const [initialPhone] = useState(() => detectCountry(initial?.contactPhone || ''));
    const [country, setCountry] = useState(initialPhone.country);
    const [phoneLocal, setPhoneLocal] = useState(initialPhone.local);
    const [phoneE164, setPhoneE164] = useState(initial?.contactPhone || '');
    const [phoneValid, setPhoneValid] = useState(Boolean(initial?.contactPhone));

    const pad = compact ? 'p-3.5' : 'p-4';

    /* ---------------- search → Places (New) ---------------- */
    const handlePick = useCallback((p) => {
        setPin({ lat: p.lat, lng: p.lng });
        setAddress(p.address);
        setApproximate(false);
    }, []);

    /* ---------------- GPS → reverse geocode ---------------- */
    const handleLocate = useCallback(
        async ({ lat, lng, accuracy }) => {
            setBusyLocate(true);
            try {
                const resolved = await reverseGeocode({ lat, lng, accuracy });
                setPin({ lat: resolved.lat, lng: resolved.lng });
                setAddress(resolved.address);
                setApproximate(resolved.approximate);
                if (resolved.approximate) toast(t('addr.approximateHint'), { icon: '📍' });
            } catch {
                setPin({ lat, lng });
                setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                setApproximate(true);
            } finally {
                setBusyLocate(false);
            }
        },
        [t]
    );

    /* ---------------- map click → move pin ---------------- */
    const handleMapClick = useCallback((p) => {
        setPin(p);
        setApproximate(false);
    }, []);

    /* ---------------- confirm ---------------- */
    const confirm = () => {
        if (!pin || !address.trim()) {
            toast.error(t('addr.needAddress'));
            return;
        }
        onConfirm?.({
            lat: pin.lat,
            lng: pin.lng,
            address: address.trim(),
            apartment: apartment.trim(),
            building: building.trim(),
            instructions: instructions.trim(),
            contactPhone: phoneValid ? phoneE164 : '',
        });
    };

    return (
        <div className="card space-y-4" style={{ padding: 0 }}>
            {/* ─── 1. Search + Use my location ─────────────────────────── */}
            <div className={`${pad} space-y-3`}>
                <div className="flex items-center gap-2">
                    <Search size={16} style={{ color: 'var(--color-brand)' }} />
                    <span className="font-bold text-[15px]">{t('addr.searchTitle')}</span>
                </div>

                <AddressAutocomplete
                    onPick={handlePick}
                    onType={setAddress}
                    origin={pin || undefined}
                    value={address}
                    placeholder={t('addr.searchPh')}
                />

                <div className="flex items-center gap-2.5" style={{ color: 'var(--color-muted)' }}>
                    <span className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">{t('common.or')}</span>
                    <span className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                </div>

                <GeolocationButton
                    className="w-full h-12 rounded-full font-semibold"
                    onLocate={handleLocate}
                />
                {busyLocate && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                        <Loader2 size={14} className="animate-spin" />
                        {t('addr.resolvingAddress')}
                    </div>
                )}
            </div>

            {/* ─── 2. Selected address + map preview ───────────────────── */}
            {pin && (
                <div className={`${pad} space-y-3`} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div className="flex items-start gap-2.5">
                        <span
                            className="w-9 h-9 rounded-full grid place-items-center shrink-0"
                            style={{ background: 'rgba(236,92,44,0.10)', color: 'var(--color-brand)' }}
                        >
                            <MapPin size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--color-brand)' }}>
                                {approximate ? t('addr.approximateLabel') : t('addr.selectedLabel')}
                            </div>
                            <div className="text-[15px] font-medium leading-snug break-words">{address}</div>
                            {approximate && (
                                <div className="text-[12px] mt-1" style={{ color: '#B45309' }}>
                                    {t('addr.approximateHint')}
                                </div>
                            )}
                        </div>
                    </div>

                    <MapView
                        height={compact ? 140 : 180}
                        center={pin}
                        markers={[{ key: 'pin', position: pin }]}
                        onClick={handleMapClick}
                    />
                    <div className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--color-muted)' }}>
                        <Navigation2 size={11} />
                        {t('addr.adjustPinHint')}
                    </div>
                </div>
            )}

            {/* ─── 3. Detail fields ───────────────────────────────────── */}
            <div className={`${pad} space-y-3.5`} style={{ borderTop: '1px solid var(--color-border)' }}>
                <Field icon={Home} label={t('addr.apartment')}>
                    <input
                        className="input"
                        value={apartment}
                        onChange={(e) => setApartment(e.target.value)}
                        placeholder={t('addr.apartmentPh')}
                        autoComplete="off"
                        maxLength={60}
                    />
                </Field>

                <Field icon={Building2} label={t('addr.building')}>
                    <input
                        className="input"
                        value={building}
                        onChange={(e) => setBuilding(e.target.value)}
                        placeholder={t('addr.buildingPh')}
                        autoComplete="off"
                        maxLength={60}
                    />
                </Field>

                <Field icon={MessageSquare} label={t('addr.instructions')}>
                    <input
                        className="input"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder={t('addr.instructionsPh')}
                        autoComplete="off"
                        maxLength={160}
                    />
                </Field>

                <Field icon={Phone} label={t('addr.contactPhone')}>
                    <PhoneInput
                        id="contact-phone"
                        value={phoneLocal}
                        country={country}
                        onChange={({ country: c, local, e164, valid }) => {
                            setCountry(c);
                            setPhoneLocal(local);
                            setPhoneE164(e164);
                            setPhoneValid(valid);
                        }}
                    />
                </Field>
            </div>

            {/* ─── 4. Confirm ─────────────────────────────────────────── */}
            <div className={pad} style={{ borderTop: '1px solid var(--color-border)' }}>
                <button
                    type="button"
                    onClick={confirm}
                    disabled={pending || busyLocate}
                    className="btn-primary w-full h-12 rounded-full font-bold text-[15px]"
                >
                    {pending ? (
                        <span className="inline-flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" /> {t('addr.saving')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-2">
                            <Check size={17} /> {submitLabel || t('addr.confirm')}
                        </span>
                    )}
                </button>
                {!GOOGLE_MAPS_API_KEY && (
                    <div className="text-[11px] mt-2 text-center" style={{ color: 'var(--color-muted)' }}>
                        {t('addr.mapsOff')}
                    </div>
                )}
            </div>
        </div>
    );
}
