import { useEffect, useState } from 'react';
import { Wallet, Receipt } from 'lucide-react';
import { api } from '../../api/client.js';
const fmt = (n) => Number(n || 0).toLocaleString();

export default function SellerCommission() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [earnings, setEarnings] = useState(null);
  const [earningsItems, setEarningsItems] = useState([]);

  const load = async (p = page) => {
    const [s, h, e, et] = await Promise.all([
      api.get('/seller/commission/summary'),
      api.get('/seller/commission/history', { params: { page: p, limit } }),
      api.get('/seller/commission/earnings/summary').catch(() => ({ data: null })),
      api.get('/seller/commission/earnings/transactions', { params: { page: 1, limit: 10 } }).catch(() => ({ data: { items: [] } })),
    ]);
    setSummary(s.data);
    setItems(h.data.items);
    setTotal(h.data.total);
    setPage(h.data.page);
    setEarnings(e.data);
    setEarningsItems(et.data.items || []);
  };

  useEffect(() => {
    load(1).catch(() => {});
  }, []);

  const currency = summary?.currency || earnings?.currency || 'ETB';
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Earnings &amp; Fees</h1>

      {/* Earnings wallet — net income from sales */}
      {earnings && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><Wallet size={18} /> Earnings wallet</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Net of platform commission
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <EarnBlock label="Today" {...earnings.today} currency={currency} />
            <EarnBlock label="This month" {...earnings.thisMonth} currency={currency} />
            <EarnBlock label="All time" {...earnings.total} currency={currency} highlight />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Gross</th>
                  <th className="p-3">Commission</th>
                  <th className="p-3">Net credited</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {earningsItems.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="p-3 font-medium">#{row.orderId}</td>
                    <td className="p-3">{fmt(row.gross)} {row.currency}</td>
                    <td className="p-3 text-red-600">- {fmt(row.commission)} {row.currency}</td>
                    <td className="p-3 font-semibold text-emerald-700">+ {fmt(row.net)} {row.currency}</td>
                    <td className="p-3 text-slate-500 text-xs">{new Date(row.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!earningsItems.length && (
                  <tr><td colSpan={5} className="p-6 text-center text-slate-500">No completed sales yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="pt-2">
        <h2 className="font-semibold flex items-center gap-2"><Receipt size={18} /> Listing fees</h2>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Charges the platform applies when you publish a new product. Your products go live immediately;
          outstanding fees are settled separately with the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`card p-4 ${summary?.pendingBalance > 0 ? 'ring-2 ring-brand-300' : ''}`}>
          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Outstanding balance</div>
          <div className="text-2xl font-bold mt-1" style={{ color: summary?.pendingBalance > 0 ? 'var(--color-brand)' : 'inherit' }}>
            {fmt(summary?.pendingBalance || 0)} {currency}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Total paid</div>
          <div className="text-2xl font-bold mt-1">{fmt(summary?.paidTotal || 0)} {currency}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>Total entries</div>
          <div className="text-2xl font-bold mt-1">{summary?.entries || 0}</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Fee amount</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id || it.id} className="border-t">
                <td className="p-3">{it.productName || '—'}</td>
                <td className="p-3 font-semibold">{fmt(it.amount)} {it.currency}</td>
                <td className="p-3">{new Date(it.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  {it.status === 'paid'
                    ? <span className="badge bg-green-100 text-green-700">paid</span>
                    : <span className="badge bg-amber-100 text-amber-700">pending</span>}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr><td colSpan={4} className="p-6 text-center text-slate-500">No commission entries yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button className="btn-ghost" disabled={page <= 1} onClick={() => load(page - 1)}>Prev</button>
          <span className="text-sm">{page} / {pageCount}</span>
          <button className="btn-ghost" disabled={page >= pageCount} onClick={() => load(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}

function EarnBlock({ label, gross, commission, net, currency, highlight = false }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-brand-300 bg-brand-50/30' : 'border-slate-200'}`}>
      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</div>
      <div className="text-2xl font-bold mt-1 text-emerald-700">+ {fmt(net)} {currency}</div>
      <div className="text-xs mt-2 space-y-0.5" style={{ color: 'var(--color-muted)' }}>
        <div>Gross: <span className="font-medium" style={{ color: 'var(--color-text)' }}>{fmt(gross)} {currency}</span></div>
        <div>Commission: <span className="font-medium text-red-600">- {fmt(commission)} {currency}</span></div>
      </div>
    </div>
  );
}
