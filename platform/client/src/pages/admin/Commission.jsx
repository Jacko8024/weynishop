import { useEffect, useMemo, useState } from 'react';
import { Download, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { API_URL } from '../../api/client.js';
const fmt = (n) => Number(n || 0).toLocaleString();

const monthLabel = (key) => {
  const [y, m] = key.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
};

function MiniBarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.totalAmount));
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d) => {
        const h = (d.totalAmount / max) * 100;
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>
              {d.totalAmount > 0 ? fmt(d.totalAmount) : ''}
            </div>
            <div
              className="w-full rounded-t"
              style={{
                height: `${Math.max(2, h)}%`,
                background: d.totalAmount > 0 ? 'var(--color-brand)' : 'var(--color-border)',
                transition: 'height 0.3s',
              }}
              title={`${monthLabel(d.month)}: ${fmt(d.totalAmount)} ETB`}
            />
            <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{monthLabel(d.month)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminCommission() {
  const [summary, setSummary] = useState(null);
  const [months, setMonths] = useState([]);
  const [tx, setTx] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [filters, setFilters] = useState({ status: '', type: '', q: '', from: '', to: '' });
  const [backfilling, setBackfilling] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bySeller, setBySeller] = useState([]);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadAll = async (p = 1) => {
    const params = { page: p, limit, ...filters };
    Object.keys(params).forEach((k) => params[k] === '' && delete params[k]);
    const [s, m, t, b, st, plat] = await Promise.all([
      api.get('/admin/commission/summary'),
      api.get('/admin/commission/monthly'),
      api.get('/admin/commission/transactions', { params }),
      api.get('/admin/commission/by-seller'),
      api.get('/admin/commission/settings'),
      // Fallback source for commissionPercent on older server deploys that
      // don't yet expose it on the commission settings route.
      api.get('/admin/settings').catch(() => ({ data: { settings: {} } })),
    ]);
    setSummary(s.data);
    setMonths(m.data.months);
    setTx(t.data.items);
    setTotal(t.data.total);
    setPage(t.data.page);
    setBySeller(b.data.sellers);
    setSettings({
      ...st.data,
      commissionPercent: st.data?.commissionPercent ?? Number(plat.data?.settings?.commissionPercent) ?? 0,
    });
    setSelected(new Set());
  };

  useEffect(() => { loadAll(1).catch(() => toast.error('Failed to load commission data')); }, []); // eslint-disable-line

  const pageCount = Math.max(1, Math.ceil(total / limit));

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const markPaidSelected = async () => {
    if (!selected.size) return;
    try {
      await api.patch('/admin/commission/mark-paid', { ids: Array.from(selected) });
      toast.success('Marked as paid');
      loadAll(page);
    } catch { toast.error('Failed'); }
  };

  const markPaidSeller = async (sellerId) => {
    if (!confirm('Mark all pending commission for this seller as paid?')) return;
    try {
      await api.patch('/admin/commission/mark-paid', { sellerId });
      toast.success('Marked as paid');
      loadAll(page);
    } catch { toast.error('Failed'); }
  };

  const exportCsv = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    const token = localStorage.getItem('token') || '';
    const url = `${API_URL}/api/v1/admin/commission/export?${params.toString()}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `commission-${Date.now()}.csv`;
        a.click();
      })
      .catch(() => toast.error('Export failed'));
  };

  const recompute = async () => {
    setBackfilling(true);
    try {
      const { data } = await api.post('/admin/commission/backfill');
      toast.success(
        data.created > 0
          ? `Created ${data.created} new commission row${data.created === 1 ? '' : 's'}`
          : 'No new commissions — already up to date'
      );
      await loadAll(1);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Backfill failed');
    } finally {
      setBackfilling(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      // Save listing-fee fields and (on new servers) commissionPercent via
      // the dedicated commission endpoint…
      const { data } = await api.patch('/admin/commission/settings', settings);
      // …and also persist commissionPercent through the legacy platform
      // settings endpoint as a belt-and-suspenders fallback for older
      // deployments that don't yet accept it on the commission route.
      try {
        await api.put('/admin/settings', { commissionPercent: Number(settings.commissionPercent) || 0 });
      } catch { /* fallback save is best-effort */ }
      // Merge so any field absent from the response keeps the value the
      // admin just entered (avoids the "save resets to 0" symptom when the
      // server hasn't redeployed yet).
      setSettings((prev) => ({ ...prev, ...data, commissionPercent: data?.commissionPercent ?? (Number(settings.commissionPercent) || 0) }));
      toast.success('Commission settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSavingSettings(false); }
  };

  if (!summary) return <div className="py-10 text-center text-slate-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Commission revenue</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            Platform fees from product listings and from each delivered sale.
          </p>
        </div>
        <button
          className="btn-secondary text-sm"
          onClick={recompute}
          disabled={backfilling}
          title="Re-scan every delivered order and create any missing sale-commission rows"
        >
          <RefreshCw size={14} className={backfilling ? 'animate-spin' : ''} />
          {backfilling ? 'Recomputing…' : 'Recompute commissions'}
        </button>
      </div>

      {/* Wallet summary — admin commission wallet */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Commission wallet</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Auto-credited on every delivery
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Today" value={`${fmt(summary.today || 0)} ETB`} />
          <Stat label="This month" value={`${fmt(summary.thisMonth)} ETB`} />
          <Stat label="All time" value={`${fmt(summary.allTime || summary.totalEarned)} ETB`} />
          <Stat label="Pending payout" value={`${fmt(summary.pending)} ETB`} highlight={summary.pending > 0} />
        </div>
        {summary.saleCommission && (
          <div className="grid grid-cols-3 gap-3 mt-3 text-xs" style={{ color: 'var(--color-muted)' }}>
            <div>Sale commissions today: <strong style={{ color: 'var(--color-text)' }}>{fmt(summary.saleCommission.today)} ETB</strong></div>
            <div>Sale commissions this month: <strong style={{ color: 'var(--color-text)' }}>{fmt(summary.saleCommission.thisMonth)} ETB</strong></div>
            <div>Sale commissions all time: <strong style={{ color: 'var(--color-text)' }}>{fmt(summary.saleCommission.allTime)} ETB</strong></div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="card p-5">
        <h2 className="font-semibold mb-2">Commission configuration</h2>
        <div className="text-xs mb-3 space-y-0.5" style={{ color: 'var(--color-muted)' }}>
          <div>
            Listing fee: <strong>{settings?.listingCommissionType === 'percentage'
              ? `${settings?.listingCommissionValue}% of product price`
              : `${fmt(settings?.listingCommissionValue || 0)} ${settings?.commissionCurrency || 'ETB'} per listing`}</strong>
          </div>
          <div>
            Sale commission: <strong>{Number(settings?.commissionPercent || 0)}% of every delivered sale</strong>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Listing fee type</label>
            <select className="input" value={settings?.listingCommissionType || 'fixed'}
                    onChange={(e) => setSettings({ ...settings, listingCommissionType: e.target.value })}>
              <option value="fixed">Fixed per listing</option>
              <option value="percentage">% of price</option>
            </select>
          </div>
          <div>
            <label className="label">Listing fee value</label>
            <input type="number" min={0} step="0.01" className="input"
                   value={settings?.listingCommissionValue ?? 0}
                   onChange={(e) => setSettings({ ...settings, listingCommissionValue: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Sale commission %</label>
            <input type="number" min={0} step="0.1" className="input"
                   value={settings?.commissionPercent ?? 0}
                   onChange={(e) => setSettings({ ...settings, commissionPercent: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Currency</label>
            <input className="input" value={settings?.commissionCurrency || 'ETB'}
                   onChange={(e) => setSettings({ ...settings, commissionCurrency: e.target.value })} />
          </div>
        </div>
        <button className="btn-primary mt-3" onClick={saveSettings} disabled={savingSettings}>
          <Save size={16} /> Save settings
        </button>
        <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
          Tip: after changing the sale commission %, click <strong>Recompute commissions</strong> above to apply it to existing delivered orders.
        </p>
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">Monthly commission (last 12 months)</h2>
        <MiniBarChart data={months} />
      </div>

      {/* Transactions */}
      <div className="card p-5 space-y-3">
        <div className="flex flex-wrap items-end gap-2 justify-between">
          <h2 className="font-semibold">Transactions</h2>
          <div className="flex flex-wrap gap-2 items-end">
            <input className="input w-44" placeholder="Search product…" value={filters.q}
                   onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            <select className="input w-32" value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
            </select>
            <select className="input w-40" value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All types</option>
              <option value="listing_fee">Listing fee</option>
              <option value="sale_commission">Sale commission</option>
              <option value="adjustment">Adjustment</option>
            </select>
            <input type="date" className="input w-40" value={filters.from}
                   onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            <input type="date" className="input w-40" value={filters.to}
                   onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
            <button className="btn-secondary" onClick={() => loadAll(1)}>Apply</button>
            <button className="btn-ghost" onClick={exportCsv}><Download size={16} /> CSV</button>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm flex items-center justify-between">
            <span>{selected.size} selected</span>
            <button className="btn-primary text-xs" onClick={markPaidSelected}>Mark selected as paid</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 w-10"></th>
                <th className="p-3">Seller</th>
                <th className="p-3">Product</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Type</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {tx.map((t) => (
                <tr key={t._id || t.id} className="border-t">
                  <td className="p-3">
                    {t.status === 'pending' && (
                      <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{t.seller?.shopName || t.seller?.name || `Seller #${t.sellerId}`}</div>
                    <div className="text-xs text-slate-500">{t.seller?.email}</div>
                  </td>
                  <td className="p-3">{t.productName}</td>
                  <td className="p-3 font-semibold">{fmt(t.amount)} {t.currency}</td>
                  <td className="p-3"><span className="badge bg-slate-100">{t.type}</span></td>
                  <td className="p-3">
                    {t.status === 'paid'
                      ? <span className="badge bg-green-100 text-green-700">paid</span>
                      : <span className="badge bg-amber-100 text-amber-700">pending</span>}
                  </td>
                  <td className="p-3">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {!tx.length && (
                <tr><td colSpan={7} className="p-6 text-center text-slate-500">No transactions match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-end gap-2">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => loadAll(page - 1)}>Prev</button>
            <span className="text-sm">{page} / {pageCount}</span>
            <button className="btn-ghost" disabled={page >= pageCount} onClick={() => loadAll(page + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* By seller */}
      <div className="card p-5">
        <h2 className="font-semibold mb-3">By seller</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Seller</th>
                <th className="p-3">Pending</th>
                <th className="p-3">Paid</th>
                <th className="p-3">Entries</th>
                <th className="p-3">Last payment</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {bySeller.map((row) => (
                <tr key={row.sellerId} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{row.seller?.shopName || row.seller?.name || `Seller #${row.sellerId}`}</div>
                    <div className="text-xs text-slate-500">{row.seller?.email}</div>
                  </td>
                  <td className="p-3 font-semibold" style={{ color: row.pending > 0 ? 'var(--color-brand)' : 'inherit' }}>
                    {fmt(row.pending)} ETB
                  </td>
                  <td className="p-3">{fmt(row.paid)} ETB</td>
                  <td className="p-3">{row.entries}</td>
                  <td className="p-3">{row.lastPaidAt ? new Date(row.lastPaidAt).toLocaleDateString() : '—'}</td>
                  <td className="p-3">
                    {row.pending > 0 && (
                      <button className="btn-secondary text-xs" onClick={() => markPaidSeller(row.sellerId)}>
                        Mark paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!bySeller.length && (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">No commission activity yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight = false }) {
  return (
    <div className={`card p-4 ${highlight ? 'ring-2 ring-brand-300' : ''}`}>
      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</div>
      <div className="text-xl md:text-2xl font-bold mt-1" style={{ color: highlight ? 'var(--color-brand)' : 'inherit' }}>
        {value}
      </div>
    </div>
  );
}
