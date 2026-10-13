import { useState } from 'react';
import { Bell, Send, Users, ShieldAlert, Sparkles, CheckCircle2, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

export default function BroadcastNotifications() {
  const [targetRole, setTargetRole] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastDispatched, setLastDispatched] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Notification title is required');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/admin/notifications/broadcast', {
        targetRole,
        title: title.trim(),
        body: body.trim(),
        link: link.trim(),
      });

      const res = data.result || {};
      toast.success(
        `Dispatched to ${res.userCount || 0} users (${res.sentPushCount || 0} mobile devices)!`
      );
      setLastDispatched({
        title,
        body,
        targetRole,
        link,
        time: new Date().toLocaleTimeString(),
        stats: res,
      });

      // Clear form
      setTitle('');
      setBody('');
      setLink('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch broadcast');
    } finally {
      setLoading(false);
    }
  };

  const setTemplate = (t, b, l = '') => {
    setTitle(t);
    setBody(b);
    setLink(l);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 text-brand-600 font-semibold text-sm mb-1" style={{ color: 'var(--color-brand)' }}>
          <Bell size={18} />
          <span>Announcements & Alerts</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Broadcast Push & In-App Notifications
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Send instant push notifications to Android devices and save announcements to user in-app notification centers.
        </p>
      </div>

      {/* Quick templates */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-sm space-y-3" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Sparkles size={14} className="text-amber-500" />
          <span>Quick Inspiration Templates</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTemplate('Flash Sale is Live! ⚡', 'Huge discounts across selected items today only. Tap to explore special deals!', '/deals')}
            className="px-3 py-1.5 rounded-full text-xs font-medium border hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            style={{ borderColor: 'var(--color-border)' }}
          >
            ⚡ Flash Sale Alert
          </button>
          <button
            type="button"
            onClick={() => setTemplate('Surprise Gift Service 🎉', 'Book a surprise gift delivery for your loved ones in Ethiopia today!', '/surprise')}
            className="px-3 py-1.5 rounded-full text-xs font-medium border hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            style={{ borderColor: 'var(--color-border)' }}
          >
            🎉 Surprise Service Promo
          </button>
          <button
            type="button"
            onClick={() => setTemplate('System Maintenance Notice 🛠️', 'WeyniShop services will undergo a brief scheduled upgrade tonight at 2:00 AM.')}
            className="px-3 py-1.5 rounded-full text-xs font-medium border hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            style={{ borderColor: 'var(--color-border)' }}
          >
            🛠️ Maintenance Notice
          </button>
          <button
            type="button"
            onClick={() => setTemplate('New App Update Available 🚀', 'Version 1.3 is out with improved maps and instant notifications! Update from Google Play.', '/')}
            className="px-3 py-1.5 rounded-full text-xs font-medium border hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            style={{ borderColor: 'var(--color-border)' }}
          >
            🚀 Version 1.3 Announcement
          </button>
        </div>
      </div>

      {/* Main Grid: Form + Live Preview */}
      <div className="grid md:grid-cols-5 gap-6">
        {/* Form (3 cols) */}
        <form onSubmit={handleSend} className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl p-6 border shadow-sm space-y-5" style={{ borderColor: 'var(--color-border)' }}>
          {/* Target Audience */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Target Audience
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'all', label: 'All Users', desc: 'Buyers, Sellers, Couriers' },
                { role: 'buyer', label: 'Buyers Only', desc: 'Shoppers & Customers' },
                { role: 'seller', label: 'Sellers Only', desc: 'Merchant Stores' },
                { role: 'delivery', label: 'Couriers Only', desc: 'Delivery Riders' },
              ].map(({ role, label, desc }) => {
                const active = targetRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className="p-3 text-left rounded-xl border transition"
                    style={{
                      background: active ? 'rgba(236,92,44,0.08)' : 'transparent',
                      borderColor: active ? 'var(--color-brand)' : 'var(--color-border)',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: active ? 'var(--color-brand)' : 'inherit' }}>
                      {label}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Notification Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Special Holiday Weekend Sale 🎉"
              maxLength={120}
              className="input w-full h-11 rounded-xl"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Message Body
            </label>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Enjoy free delivery on all orders over 500 ETB this weekend only!"
              maxLength={400}
              className="input w-full p-3 rounded-xl resize-none"
            />
          </div>

          {/* Target In-App Link */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Destination Route (Deep Link)
            </label>
            <div className="relative">
              <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/deals or /surprise or leave blank"
                className="input pl-10 w-full h-11 rounded-xl"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="btn-primary w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-2"
          >
            <Send size={16} />
            <span>{loading ? 'Broadcasting to Users…' : 'Send Broadcast Now'}</span>
          </button>
        </form>

        {/* Live Device Preview (2 cols) */}
        <div className="md:col-span-2 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Real-Time Mobile Preview
          </div>

          {/* Mock Android Notification Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-brand-500 grid place-items-center text-[9px] font-bold text-white" style={{ background: 'var(--color-brand)' }}>
                  W
                </div>
                <span className="font-semibold text-slate-300">WeyniShop</span>
                <span>•</span>
                <span>Just now</span>
              </div>
              <Bell size={12} />
            </div>

            <div className="space-y-1">
              <div className="font-bold text-sm text-white">
                {title.trim() || 'Your Notification Title'}
              </div>
              <div className="text-xs text-slate-300 leading-relaxed">
                {body.trim() || 'Your broadcast message preview will appear here as users receive it.'}
              </div>
            </div>

            {link && (
              <div className="text-[10px] text-brand-400 font-mono pt-1 border-t border-slate-800 flex items-center gap-1">
                <span>Route:</span>
                <span className="underline">{link}</span>
              </div>
            )}
          </div>

          {/* Last Dispatched summary if available */}
          {lastDispatched && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 text-xs space-y-2 text-emerald-800 dark:text-emerald-300 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={16} />
                <span>Last Broadcast Successful ({lastDispatched.time})</span>
              </div>
              <p>
                Sent to <strong>{lastDispatched.stats?.userCount || 0}</strong> user accounts and{' '}
                <strong>{lastDispatched.stats?.sentPushCount || 0}</strong> active push devices for audience:{' '}
                <code>{lastDispatched.targetRole}</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
