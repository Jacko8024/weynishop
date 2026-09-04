import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, KeyRound, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';

/**
 * Change-password and Account-deletion bottom sheet (spec §27 Settings ▸ Security).
 *
 * Google Play Store compliance: users must be able to initiate account deletion
 * within the app.
 */
export default function SecuritySheet({ open, onClose }) {
    const { t } = useTranslation();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteBusy, setDeleteBusy] = useState(false);

    const reset = () => {
        setCurrent('');
        setNext('');
        setConfirm('');
        setBusy(false);
        setShowDeleteConfirm(false);
        setDeleteBusy(false);
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

    const handleDeleteAccount = async () => {
        setDeleteBusy(true);
        try {
            await api.delete('/users/me');
            toast.success(t('settings.deleteAccountSuccess'));
            close();
            useAuth.getState().logout();
            window.location.assign('/');
        } catch (e) {
            toast.error(e?.response?.data?.message || t('common.error'));
            setDeleteBusy(false);
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
                className="absolute bottom-0 inset-x-0 rounded-t-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t('settings.security')}
                style={{ background: 'var(--color-surface)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
            >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div className="font-bold flex items-center gap-2">
                        <KeyRound size={17} /> {t('settings.security')}
                    </div>
                    <button onClick={close} className="w-9 h-9 grid place-items-center rounded-full btn-ghost" aria-label={t('common.close')}>
                        <X size={18} />
                    </button>
                </div>

                <div className="px-4 py-4 flex flex-col gap-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted mb-0.5">
                        {t('settings.changePassword')}
                    </div>
                    {field(t('settings.currentPassword'), current, setCurrent, 'current-password')}
                    {field(t('settings.newPassword'), next, setNext, 'new-password')}
                    {field(t('settings.confirmPassword'), confirm, setConfirm, 'new-password')}
                    <button
                        onClick={save}
                        disabled={!canSave}
                        className="btn-primary w-full h-11 rounded-full font-semibold mt-1"
                    >
                        {busy ? t('common.loading') : t('settings.changePassword')}
                    </button>

                    {/* ── Google Play Account Deletion Section ── */}
                    <div className="mt-6 pt-5 border-t border-border">
                        <div className="text-xs font-bold uppercase tracking-wider text-danger-500 mb-2 flex items-center gap-1.5">
                            <Trash2 size={14} /> {t('settings.deleteAccount')}
                        </div>

                        {!showDeleteConfirm ? (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full h-11 rounded-full font-semibold text-danger-600 bg-danger-50 border border-danger-200 hover:bg-danger-100 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                <Trash2 size={16} /> {t('settings.deleteAccount')}
                            </button>
                        ) : (
                            <div className="p-3.5 rounded-xl bg-danger-50/70 border border-danger-200 animate-fadeIn">
                                <div className="flex items-start gap-2.5 text-danger-700 text-xs leading-relaxed mb-3">
                                    <AlertTriangle size={18} className="shrink-0 mt-0.5 text-danger-600" />
                                    <span>{t('settings.deleteAccountWarning')}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={deleteBusy}
                                        className="btn-secondary flex-1 h-9 rounded-full text-xs font-semibold"
                                    >
                                        {t('settings.deleteAccountCancel')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeleteAccount}
                                        disabled={deleteBusy}
                                        className="flex-1 h-9 rounded-full bg-danger-600 text-white hover:bg-danger-700 text-xs font-semibold flex items-center justify-center gap-1"
                                    >
                                        {deleteBusy ? t('common.loading') : t('settings.deleteAccountConfirm')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

