import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Package, Store, Bike, XCircle, ChevronLeft } from 'lucide-react';
import { api } from '../../api/client.js';

/**
 * Notifications screen (Phase 7) — Account ▸ Notifications.
 * Real backend data only (GET /notifications): rows are created by the
 * server whenever it dispatches a push (order events, assignments…).
 * No fake/demo notifications, ever.
 */

const ICONS = {
    'order:new': Package,
    'order:stage': Package,
    'delivery:assigned': Bike,
    'order:delivered': CheckCheck,
    'order:cancelled': XCircle,
    general: Bell,
};

const timeAgo = (iso) => {
    const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
};

export default function MobileNotifications() {
    const { t } = useTranslation();
    const nav = useNavigate();
    const [items, setItems] = useState(null); // null = loading
    const [unread, setUnread] = useState(0);

    const load = useCallback(async () => {
        try {
            const { data } = await api.get('/notifications?limit=30');
            setItems(data.notifications);
            setUnread(data.unreadCount);
        } catch {
            setItems([]);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const open = async (n) => {
        if (!n.read) {
            setItems((list) => list?.map((x) => (x._id === n._id ? { ...x, read: true } : x)) || list);
            setUnread((u) => Math.max(0, u - 1));
            api.put(`/notifications/${n._id}/read`).catch(() => { });
        }
        if (n.link?.startsWith('/')) nav(n.link);
    };

    const markAll = async () => {
        await api.put('/notifications/read-all').catch(() => { });
        setItems((list) => list?.map((x) => ({ ...x, read: true })));
        setUnread(0);
    };

    return (
        <div className="pb-6 safe-bottom">
            {/* Header */}
            <div className="sticky top-0 z-10 safe-top flex items-center gap-2 px-3 h-14"
                style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                <button type="button" onClick={() => nav('/account')} aria-label={t('common.back')}
                    className="w-9 h-9 grid place-items-center rounded-full active:bg-black/5">
                    <ChevronLeft size={22} />
                </button>
                <div className="font-bold text-[17px] flex items-center gap-2">
                    {t('notif.title')}
                    {unread > 0 && (
                        <span className="text-[11px] font-bold text-white rounded-full px-2 py-0.5 min-w-[20px] text-center"
                            style={{ background: 'var(--color-flash)' }}>
                            {unread}
                        </span>
                    )}
                </div>
                <div className="flex-1" />
                {unread > 0 && (
                    <button type="button" onClick={markAll}
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 h-8 rounded-full"
                        style={{ color: 'var(--color-brand)', background: 'rgba(236,92,44,0.08)' }}>
                        <CheckCheck size={14} /> {t('notif.markAllRead')}
                    </button>
                )}
            </div>

            {/* List — real data only */}
            <div className="px-3">
                {items === null && (
                    <div className="py-16 space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="card p-4 flex gap-3 animate-pulse">
                                <div className="w-9 h-9 rounded-full bg-black/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 w-2/3 rounded bg-black/10" />
                                    <div className="h-3 w-5/6 rounded bg-black/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {items !== null && items.length === 0 && (
                    <div className="py-20 text-center">
                        <Bell size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                            {t('notif.empty')}
                        </p>
                    </div>
                )}

                {items?.map((n) => {
                    const Icon = ICONS[n.type] || Bell;
                    return (
                        <button
                            key={n._id}
                            type="button"
                            onClick={() => open(n)}
                            className="w-full text-left card p-4 mb-2.5 flex gap-3 items-start active:opacity-80"
                            style={n.read ? undefined : { borderColor: 'rgba(236,92,44,0.35)', background: 'rgba(236,92,44,0.04)' }}
                        >
                            <span className="w-9 h-9 rounded-full grid place-items-center shrink-0"
                                style={{ background: 'rgba(236,92,44,0.10)', color: 'var(--color-brand)' }}>
                                <Icon size={17} />
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="flex items-center gap-2">
                                    <span className="font-semibold text-[15px] truncate flex-1">{n.title}</span>
                                    <span className="text-[11px] shrink-0" style={{ color: 'var(--color-muted)' }}>
                                        {timeAgo(n.createdAt)}
                                    </span>
                                </span>
                                <span className="block text-[13px] mt-0.5 leading-snug line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                                    {n.body}
                                </span>
                            </span>
                            {!n.read && <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: 'var(--color-flash)' }} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
