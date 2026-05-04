import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

export default function AdminSettings() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/settings').then(({ data }) => setS(data.settings)); }, []);

  const save = async () => {
    try {
      const { data } = await api.put('/admin/settings', s);
      setS(data.settings);
      toast.success('Saved');
    } catch { toast.error('Failed'); }
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
      </div>
    </div>
  );
}
