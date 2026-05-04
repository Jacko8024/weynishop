import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ role: '', status: '', q: '' });

  const load = () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
    api.get('/admin/users', { params }).then(({ data }) => setUsers(data.users));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters]);

  const update = async (id, body) => {
    try {
      await api.put(`/admin/users/${id}`, body);
      toast.success('Updated');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Users</h1>
      <div className="card p-3 mb-4 flex flex-wrap gap-3 items-end">
        <div><label className="label">Role</label>
          <select className="input" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All</option>
            {['buyer', 'seller', 'delivery', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label className="label">Status</label>
          <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            {['pending', 'active', 'suspended'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]"><label className="label">Search</label>
          <input className="input" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} placeholder="Name or email" />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Email</th>
              <th className="p-3">Role</th><th className="p-3">Status</th>
              <th className="p-3">Flags</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3"><span className="badge bg-slate-100">{u.role}</span></td>
                <td className="p-3">
                  <span className={`badge ${u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'suspended' ? 'bg-danger-100 text-danger-700' : 'bg-amber-100 text-amber-700'}`}>{u.status}</span>
                </td>
                <td className="p-3">{u.flagged ? '🚩' : ''}</td>
                <td className="p-3 flex gap-2">
                  {u.status !== 'active' && <button onClick={() => update(u._id, { status: 'active' })} className="btn-secondary text-xs">Approve</button>}
                  {u.status !== 'suspended' && <button onClick={() => update(u._id, { status: 'suspended' })} className="btn-danger text-xs">Suspend</button>}
                  <button onClick={() => update(u._id, { flagged: !u.flagged })} className="btn-ghost text-xs">{u.flagged ? 'Unflag' : 'Flag'}</button>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No users</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
