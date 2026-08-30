import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { api } from '../../api/client.js';
import { formatMoney, STAGE_LABELS } from '../../lib/helpers.js';

/**
 * Admin dashboard (spec §29 desktop redesign).
 *
 * All numbers come from the real GET /admin/analytics aggregation
 * (orders, users, products, top products by units sold, weekly revenue
 * of completed orders). No fabricated data. Money is shown in the base
 * currency (ETB) — the admin portal intentionally does not convert with
 * display rates (spec §24).
 */
export default function AdminDashboard() {
  const [a, setA] = useState(null);
  const [orders, setOrders] = useState([]);
  const [surprise, setSurprise] = useState([]);

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setA(data));
    api.get('/admin/orders').then(({ data }) => setOrders(data.orders.slice(0, 10)));
    api.get('/surprise/admin', { params: { limit: 5 } })
      .then(({ data }) => setSurprise(data.items || []))
      .catch(() => { });
  }, []);

  if (!a) return <div className="py-10 text-center text-slate-500">Loading…</div>;

  const salesPrev = a.salesByWeek?.slice(0, 4).reduce((s, w) => s + w.revenue, 0) || 0;
  const salesLast = a.salesByWeek?.slice(4).reduce((s, w) => s + w.revenue, 0) || 0;
  const trendUp = salesLast >= salesPrev;
  const trendPct = salesPrev > 0 ? Math.round(((salesLast - salesPrev) / salesPrev) * 100) : null;
  const maxWeek = Math.max(1, ...(a.salesByWeek || []).map((w) => w.revenue));

  const stats = [
    { label: 'Total sales', value: formatMoney(a.revenue), sub: `${a.completed} completed orders`, highlight: true },
    { label: 'Total orders', value: a.totalOrders, sub: `${a.activeOrders} active now` },
    { label: 'Customers', value: a.usersByRole.buyer || 0, sub: 'Buyer accounts' },
    { label: 'Vendors', value: a.usersByRole.seller || 0, sub: 'Seller accounts' },
    { label: 'Delivery', value: a.usersByRole.delivery || 0, sub: 'Rider accounts' },
    { label: 'Products', value: a.totalProducts, sub: 'Catalog items' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>

      {/* Stat cards (§29) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className={`text-lg font-bold mt-1 ${s.highlight ? 'text-brand-700' : ''}`}>{s.value}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Sales overview (§29): real weekly revenue of completed orders */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp size={16} style={{ color: 'var(--color-brand)' }} /> Sales overview
            <span className="text-xs font-normal text-slate-400">(completed orders · last 8 weeks)</span>
          </h2>
          {trendPct !== null && (
            <span
              className={`badge inline-flex items-center gap-1 ${trendUp ? '' : ''}`}
              style={{ background: trendUp ? '#ECFDF5' : '#FEF2F2', color: trendUp ? '#065F46' : '#991B1B' }}
            >
              {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendUp ? '+' : ''}{trendPct}% vs prev. 4 weeks
            </span>
          )}
        </div>
        <div className="flex items-end gap-2 h-40">
          {(a.salesByWeek || []).map((w, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div
                className="w-full rounded-t-md transition-all group-hover:opacity-80"
                style={{
                  height: `${Math.max(3, (w.revenue / maxWeek) * 100)}%`,
                  background: i >= 4 ? 'linear-gradient(180deg,#F59E0B,#EB5824)' : '#E2E8F0',
                  minHeight: 4,
                }}
                title={`${w.label}: ${formatMoney(w.revenue)} · ${w.orders} orders`}
              />
              <span className="text-[10px] text-slate-400 whitespace-nowrap">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Recent orders (§29) */}
        <div>
          <h2 className="font-semibold mb-2">Recent orders</h2>
          <div className="card divide-y divide-slate-100">
            {orders.map((o) => (
              <div key={o._id} className="p-3 flex justify-between text-sm">
                <div>
                  <div className="font-medium">#{o._id.slice(-6).toUpperCase()} · {o.buyer?.name} → {o.seller?.shopName || o.seller?.name}</div>
                  <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatMoney(o.total)}</div>
                  <div className="text-xs text-slate-500">{o.cancelledAt ? 'Cancelled' : STAGE_LABELS[o.currentStage]}</div>
                </div>
              </div>
            ))}
            {!orders.length && <div className="p-3 text-sm text-slate-500">No orders yet.</div>}
          </div>
        </div>

        {/* Top products (§29) */}
        <div>
          <h2 className="font-semibold mb-2 flex items-center gap-1.5">
            <Package size={16} style={{ color: 'var(--color-brand)' }} /> Top products
            <span className="text-xs font-normal text-slate-400">(by units sold)</span>
          </h2>
          <div className="card divide-y divide-slate-100">
            {(a.topProducts || []).map((p, i) => (
              <div key={p.id} className="p-3 flex items-center gap-3 text-sm">
                <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                {p.image ? (
                  <img src={p.image} alt="" className="w-9 h-9 rounded-md object-cover shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-md bg-slate-100 grid place-items-center shrink-0">
                    <Package size={16} className="text-slate-400" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.units} sold</div>
                </div>
                <div className="font-semibold whitespace-nowrap">{formatMoney(p.revenue)}</div>
              </div>
            ))}
            {!(a.topProducts || []).length && (
              <div className="p-3 text-sm text-slate-500">No sales recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Surprise bookings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold flex items-center gap-1.5">
            <Gift size={16} style={{ color: 'var(--color-brand)' }} /> Surprise bookings
            <span className="badge" style={{ background: '#FEF3C7', color: '#92400E' }}>
              {a.surpriseNew} new
            </span>
          </h2>
          <Link to="/admin/surprise" className="text-xs" style={{ color: 'var(--color-brand)' }}>Manage →</Link>
        </div>
        <div className="card divide-y divide-slate-100">
          {surprise.map((b) => (
            <div key={b.id} className="p-3 flex justify-between text-sm">
              <div>
                <div className="font-medium">🎁 {b.name} · {b.phone}</div>
                <div className="text-xs text-slate-500">
                  {b.serviceType}{b.provider ? ` · ${b.provider}` : ''}{b.price != null ? ` · ${formatMoney(b.price)}` : ''}
                </div>
              </div>
              <div className="text-right">
                <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>{b.status}</span>
                <div className="text-xs text-slate-500 mt-1">{new Date(b.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {!surprise.length && <div className="p-3 text-sm text-slate-500">No surprise bookings yet.</div>}
        </div>
      </div>
    </div>
  );
}
