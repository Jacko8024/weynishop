import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

export default function AdminSettings() {
  const [s, setS] = useState(null);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => { api.get('/admin/settings').then(({ data }) => setS(data.settings)); }, []);

  const save = async () => {
    try {
      const { data } = await api.put('/admin/settings', s);
      setS(data.settings);
      toast.success('Saved');
    } catch { toast.error('Failed'); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!pwd.currentPassword || !pwd.newPassword) return toast.error('Please fill all fields');
    if (pwd.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (pwd.newPassword !== pwd.confirmPassword) return toast.error('New passwords do not match');
    setPwdSaving(true);
    try {
      await api.put('/users/me/password', { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success('Password updated successfully');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPwdSaving(false);
    }
  };

  if (!s) return <div className="py-10 text-center text-slate-500">Loading…</div>;

  const set = (patch) => setS({ ...s, ...patch });
  const setTpl = (k, v) => setS({ ...s, notificationTemplates: { ...s.notificationTemplates, [k]: v } });

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Platform settings</h1>
      <div className="card p-5 space-y-3">
        <div><label className="label">Delivery radius (km)</label>
          <input type="number" className="input" value={s.deliveryRadiusKm} onChange={(e) => set({ deliveryRadiusKm: Number(e.target.value) })} />
        </div>
        <div className="text-xs p-3 rounded-lg bg-slate-50 border border-slate-200" style={{ color: 'var(--color-muted)' }}>
          Commission rates are now managed on the dedicated <a className="text-brand-600 font-medium" href="/admin/commission">Commission page</a>.
        </div>
        <div><label className="label">Flat delivery fee</label>
          <input type="number" className="input" value={s.flatDeliveryFee} onChange={(e) => set({ flatDeliveryFee: Number(e.target.value) })} />
        </div>
        <hr />
        <h2 className="font-semibold">Notification templates</h2>
        <div><label className="label">Order placed</label>
          <input className="input" value={s.notificationTemplates.orderPlaced} onChange={(e) => setTpl('orderPlaced', e.target.value)} />
        </div>
        <div><label className="label">Out for delivery</label>
          <input className="input" value={s.notificationTemplates.outForDelivery} onChange={(e) => setTpl('outForDelivery', e.target.value)} />
        </div>
        <div><label className="label">Delivered</label>
          <input className="input" value={s.notificationTemplates.delivered} onChange={(e) => setTpl('delivered', e.target.value)} />
        </div>
        <button className="btn-primary" onClick={save}>Save settings</button>

        <hr className="my-8 border-slate-200" />
        <h2 className="font-semibold">Change password</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input type="password" required className="input" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">New password</label>
            <input type="password" required minLength={6} className="input" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" required minLength={6} className="input" value={pwd.confirmPassword} onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })} />
          </div>
          <button type="submit" className="btn-secondary" disabled={pwdSaving}>
            {pwdSaving ? 'Saving...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
