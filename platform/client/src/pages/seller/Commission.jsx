import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
const fmt = (n) => Number(n || 0).toLocaleString();

export default function SellerCommission() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async (p = page) => {
    const [s, h] = await Promise.all([
      api.get('/seller/commission/summary'),
      api.get('/seller/commission/history', { params: { page: p, limit } }),
    ]);
    setSummary(s.data);
    setItems(h.data.items);
    setTotal(h.data.total);
    setPage(h.data.page);
  };

  useEffect(() => {
    load(1).catch(() => {});
  }, []);

  const currency = summary?.currency || 'ETB';
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Commission &amp; Fees</h1>
      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
        Listing fees the platform charges when you publish a new product. Your products go live immediately;
        outstanding fees are settled separately with the platform.
      </p>

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
