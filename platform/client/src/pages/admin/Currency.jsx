import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Pencil, Plus, Save, Trash2, X, Coins } from 'lucide-react';
import { api } from '../../api/client.js';
import { useCurrency, CURRENCY_BASE } from '../../store/currency.js';

/**
 * Admin › Currency & Exchange Rates (spec §30).
 *
 * Displays the real `currencies` DB table: base currency row + one row per
 * supported currency with its rate-to-base and status. Rates are edited
 * inline and saved through PUT /admin/currencies/:code; new currencies can
 * be added, non-base ones removed. After every save the shared currency
 * store is reloaded so the whole storefront reflects the new rates without
 * a refresh (admin sets rate → DB → API → clients, spec §20).
 */
const blank = { code: '', name: '', symbol: '', rateToBase: '', decimals: 2 };

export default function AdminCurrency() {
    const [base, setBase] = useState(CURRENCY_BASE);
    const [rows, setRows] = useState(null);
    const [editing, setEditing] = useState(null); // code being edited
    const [draft, setDraft] = useState(''); // rate input while editing
    const [busy, setBusy] = useState(false);
    const [adding, setAdding] = useState(false);
    const [nu, setNu] = useState({ ...blank });
    const reloadStore = useCurrency((s) => s.loadRates);

    const load = async () => {
        try {
            const { data } = await api.get('/admin/currencies');
            setBase(data.base);
            setRows(data.currencies);
        } catch {
            toast.error('Failed to load currencies');
            setRows([]);
        }
    };
    useEffect(() => { load(); }, []);

    const startEdit = (c) => { setEditing(c.code); setDraft(String(c.rateToBase)); };
    const cancelEdit = () => { setEditing(null); setDraft(''); };

    const save = async (c) => {
        const rate = Number(draft);
        if (!Number.isFinite(rate) || rate <= 0) return toast.error('Rate must be a positive number');
        setBusy(true);
        try {
            await api.put(`/admin/currencies/${c.code}`, { rateToBase: rate });
            toast.success(`${c.code} rate saved`);
            cancelEdit();
            await load();
            reloadStore(); // push new rates to the live storefront immediately
        } catch (e) {
            toast.error(e.response?.data?.message || 'Save failed');
        } finally {
            setBusy(false);
        }
    };

    const toggleActive = async (c) => {
        setBusy(true);
        try {
            await api.put(`/admin/currencies/${c.code}`, { active: !c.active });
            await load();
            reloadStore();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Update failed');
        } finally {
            setBusy(false);
        }
    };

    const remove = async (c) => {
        if (c.code === base) return;
        if (!window.confirm(`Remove ${c.code}? Customers will no longer see it.`)) return;
        setBusy(true);
        try {
            await api.delete(`/admin/currencies/${c.code}`);
            toast.success(`${c.code} removed`);
            await load();
            reloadStore();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Delete failed');
        } finally {
            setBusy(false);
        }
    };

    const add = async (e) => {
        e.preventDefault();
        const code = nu.code.trim().toUpperCase();
        if (!/^[A-Z]{3}$/.test(code)) return toast.error('Code must be 3 letters (e.g. SAR)');
        const rate = Number(nu.rateToBase);
        if (!Number.isFinite(rate) || rate <= 0) return toast.error('Rate must be a positive number');
        setBusy(true);
        try {
            await api.put(`/admin/currencies/${code}`, {
                name: nu.name.trim() || code,
                symbol: nu.symbol.trim() || code,
                rateToBase: rate,
                decimals: Number(nu.decimals) || 2,
                active: true,
            });
            toast.success(`${code} added`);
            setNu({ ...blank });
            setAdding(false);
            await load();
            reloadStore();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Add failed');
        } finally {
            setBusy(false);
        }
    };

    if (!rows) return <div className="py-10 text-center text-slate-500">Loading…</div>;

    const baseRow = rows.find((r) => r.code === base);
    const others = rows.filter((r) => r.code !== base);
    const lastUpdated = rows.reduce(
        (m, r) => { const t = new Date(r.updatedAt); return t > m ? t : m; },
        new Date(0)
    );

    return (
        <div className="max-w-3xl">
            <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Coins size={20} style={{ color: 'var(--color-brand)' }} /> Currency & Exchange Rates
            </h1>
            <p className="text-sm text-slate-500 mb-5">
                Rates define how many ETB one unit of a currency is worth. Customers see prices converted
                with these rates; orders are always processed in the base currency.
            </p>

            {/* Base currency */}
            <div className="card p-4 mb-5 flex items-center justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Base currency</div>
                    <div className="font-bold mt-0.5">
                        {base} — {baseRow?.name || 'Ethiopian Birr'}
                    </div>
                </div>
                <span className="badge" style={{ background: '#ECFDF5', color: '#065F46' }}>Fixed</span>
            </div>

            {/* Exchange rates table */}
            <div className="card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500" style={{ background: 'var(--color-bg)' }}>
                            <th className="px-4 py-3">Currency</th>
                            <th className="px-4 py-3">Rate</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold">{base}</td>
                            <td className="px-4 py-3">1.00 {base}</td>
                            <td className="px-4 py-3">Active</td>
                            <td className="px-4 py-3 text-right text-slate-400">—</td>
                        </tr>
                        {others.map((c) => {
                            const isEditing = editing === c.code;
                            return (
                                <tr key={c.code} className="border-t border-slate-100">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold">{c.code}</div>
                                        <div className="text-xs text-slate-500">{c.name}</div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {isEditing ? (
                                            <span className="inline-flex items-center gap-1">
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    className="input w-32"
                                                    value={draft}
                                                    onChange={(e) => setDraft(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') save(c);
                                                        if (e.key === 'Escape') cancelEdit();
                                                    }}
                                                />
                                                <span className="text-xs text-slate-500">{base}</span>
                                            </span>
                                        ) : (
                                            `${Number(c.rateToBase).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${base}`
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => toggleActive(c)}
                                            disabled={busy}
                                            className="badge cursor-pointer disabled:opacity-50"
                                            style={{
                                                background: c.active ? '#ECFDF5' : '#F3F4F6',
                                                color: c.active ? '#065F46' : '#6B7280',
                                            }}
                                            title={c.active ? 'Click to deactivate' : 'Click to activate'}
                                        >
                                            {c.active ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        {isEditing ? (
                                            <>
                                                <button onClick={() => save(c)} disabled={busy} className="btn-primary text-xs px-2.5 py-1.5 mr-1" title="Save">
                                                    <Save size={14} />
                                                </button>
                                                <button onClick={cancelEdit} className="btn-secondary text-xs px-2.5 py-1.5" title="Cancel">
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEdit(c)} disabled={busy} className="btn-secondary text-xs px-2.5 py-1.5 mr-1" title="Edit rate">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => remove(c)} disabled={busy} className="btn-secondary text-xs px-2.5 py-1.5 text-danger-500" title="Remove">
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Add currency */}
                {adding ? (
                    <form onSubmit={add} className="border-t border-slate-200 p-4 flex flex-wrap gap-2 items-end" style={{ background: 'var(--color-bg)' }}>
                        <div>
                            <label className="label">Code</label>
                            <input className="input w-20" maxLength={3} placeholder="SAR" value={nu.code}
                                onChange={(e) => setNu({ ...nu, code: e.target.value.toUpperCase() })} />
                        </div>
                        <div>
                            <label className="label">Name</label>
                            <input className="input w-36" placeholder="Saudi Riyal" value={nu.name}
                                onChange={(e) => setNu({ ...nu, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Symbol</label>
                            <input className="input w-20" placeholder="SAR" value={nu.symbol}
                                onChange={(e) => setNu({ ...nu, symbol: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Rate (1 unit = ? {base})</label>
                            <input className="input w-28" type="number" step="any" min="0" placeholder="40.00" value={nu.rateToBase}
                                onChange={(e) => setNu({ ...nu, rateToBase: e.target.value })} />
                        </div>
                        <div>
                            <label className="label">Decimals</label>
                            <input className="input w-20" type="number" min="0" max="4" value={nu.decimals}
                                onChange={(e) => setNu({ ...nu, decimals: e.target.value })} />
                        </div>
                        <button type="submit" disabled={busy} className="btn-primary text-sm">Add</button>
                        <button type="button" onClick={() => setAdding(false)} className="btn-secondary text-sm">Cancel</button>
                    </form>
                ) : (
                    <button onClick={() => setAdding(true)} className="w-full py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1.5">
                        <Plus size={15} /> Add currency
                    </button>
                )}
            </div>

            <p className="text-xs text-slate-500 mt-3">
                Last updated: {lastUpdated.getTime() > 0 ? lastUpdated.toLocaleString() : '—'}
            </p>
        </div>
    );
}
