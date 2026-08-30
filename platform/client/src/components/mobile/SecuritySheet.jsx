import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

/**
 * Change-password bottom sheet (spec §27 Settings ▸ Security).
 *
 * Uses the real PUT /users/me/password endpoint (requires the current
 * password — no fake "reset" flows). Fields clear every time the sheet
 * closes so no password lingers in component state.
 */
export default function SecuritySheet({ open, onClose }) {
    const { t } = useTranslation();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);

    const reset = () => {
        setCurrent('');
        setNext('');
        setConfirm('');
        setBusy(false);
    };

    const close = () => {
        reset();
        onClose();
    };

    if (!open) return null;

    const canSave = !busy && current && next.length >= 6 && next === confirm;

    const save = async () => {
        if (next !== confirm) return toast.error(t('settings.passwordsNoMatch'));
        if (next.length < 6) return toast.error(t('settings.passwordShort'));
        setBusy(true);
        try {
            await api.put('/users/me/password', { currentPassword: current, newPassword: next });
            toast.success(t('settings.passwordChanged'));
            close();
        } catch (e) {
            toast.error(e?.response?.data?.message || t('common.error'));
            setBusy(false);
        }
    };

    const field = (label, value, set, autoComplete) => (
        <label className="block">
            <span className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-muted)' }}>
                {label}
            </span>
            <input
                type="password"
                className="input w-full"
                value={value}
                onChange={(e) => set(e.target.value)}
                autoComplete={autoComplete}
            />
        </label>
    );

    return createPortal(
        <div className="fixed inset-0 z-[60] bg-black/50 animate-fadeIn" onClick={close}>
            <div
                className="absolute bottom-0 inset-x-0 rounded-t-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t('settings.security')}
                style={{ background: 'var(--color-surface)', paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
            >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div className="font-bold flex items-center gap-2">
                        <KeyRound size={17} /> {t('settings.changePassword')}
                    </div>
                    <button onClick={close} className="w-9 h-9 grid place-items-center rounded-full btn-ghost" aria-label={t('common.close')}>
                        <X size={18} />
                    </button>
                </div>

                <div className="px-4 py-4 flex flex-col gap-3">
                    {field(t('settings.currentPassword'), current, setCurrent, 'current-password')}
                    {field(t('settings.newPassword'), next, setNext, 'new-password')}
                    {field(t('settings.confirmPassword'), confirm, setConfirm, 'new-password')}
                    <button
                        onClick={save}
                        disabled={!canSave}
                        className="btn-primary w-full h-12 rounded-full font-semibold mt-1"
                    >
                        {busy ? t('common.loading') : t('settings.changePassword')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
