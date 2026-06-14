import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import { Plus, X, LogIn } from 'lucide-react';

const emptyUser = { name: '', email: '', password: '', role: 'seller', phone: '', shopName: '' };

export default function AdminUsers() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ role: '', status: '', q: '' });
  const [creating, setCreating] = useState(null);

  const load = () => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
    api.get('/admin/users', { params }).then(({ data }) => setUsers(data.users));
  };
  useEffect(() => { load(); }, [filters]);

  const update = async (id, body) => {
    try {
      await api.put(`/admin/users/${id}`, body);
      toast.success('Updated');
      load();
    } catch { toast.error('Failed'); }
  };

  const impersonate = async (userId) => {
    try {
      const { data } = await api.post(`/admin/impersonate/${userId}`);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = `/${data.user.role}`;
    } catch {
      toast.error('Failed to impersonate');
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!creating.name || !creating.email || !creating.password) {
      return toast.error('Name, email, and password required');
    }
    try {
      const payload = {
        ...creating,
        phone: creating.phone || '',
        shopName: creating.role === 'seller' ? (creating.shopName || creating.name) : undefined,
      };
      await api.post('/auth/register', payload);
      toast.success('User created');
      setCreating(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Users</h1>
        <button className="btn-primary text-sm" onClick={() => setCreating({ ...emptyUser })}>
          <Plus size={16} /> Create user
        </button>
      </div>

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
            {['pending', 'active', 'suspended', 'rejected'].map((r) => <option key={r} value={r}>{r}</option>)}
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
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3"><span className="badge bg-slate-100">{u.role}</span></td>
                <td className="p-3">
                  <span className={`badge ${u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'suspended' ? 'bg-danger-100 text-danger-700' : u.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{u.status}</span>
                </td>
                <td className="p-3">{u.flagged ? '🚩' : ''}</td>
                <td className="p-3 flex flex-wrap gap-1">
                  {u.status !== 'active' && <button onClick={() => update(u._id, { status: 'active' })} className="btn-secondary text-xs">Approve</button>}
                  {u.status !== 'suspended' && <button onClick={() => update(u._id, { status: 'suspended' })} className="btn-danger text-xs">Suspend</button>}
                  <button onClick={() => update(u._id, { flagged: !u.flagged })} className="btn-ghost text-xs">{u.flagged ? 'Unflag' : 'Flag'}</button>
                  <button onClick={() => impersonate(u._id)}
                    className="btn-ghost text-xs inline-flex items-center gap-1 text-brand-600"
                    title={`Login as ${u.name}`}>
                    <LogIn size={13} /> Login as
                  </button>
                </td>
              </tr>
            ))}
            {!users.length && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No users</td></tr>}
          </tbody>
        </table>
      </div>

      {creating && (
        <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4" onClick={() => setCreating(null)}>
          <form onSubmit={createUser} onClick={(e) => e.stopPropagation()}
                className="card p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Create user</h2>
              <button type="button" onClick={() => setCreating(null)} className="btn-ghost"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Role</label>
                <select className="input" value={creating.role} onChange={(e) => setCreating({ ...creating, role: e.target.value })}>
                  {['buyer', 'seller', 'delivery'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><label className="label">Shop name</label>
                <input className="input" value={creating.shopName} onChange={(e) => setCreating({ ...creating, shopName: e.target.value })}
                       placeholder={creating.role === 'seller' ? 'Required for vendors' : 'Optional'} />
              </div>
            </div>

            <div><label className="label">Full name</label>
              <input className="input" required value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Email</label>
                <input className="input" type="email" required value={creating.email} onChange={(e) => setCreating({ ...creating, email: e.target.value })} />
              </div>
              <div><label className="label">Phone</label>
                <input className="input" value={creating.phone} onChange={(e) => setCreating({ ...creating, phone: e.target.value })} />
              </div>
            </div>
            <div><label className="label">Password</label>
              <input className="input" type="password" required value={creating.password} onChange={(e) => setCreating({ ...creating, password: e.target.value })} />
            </div>

            <button className="btn-primary w-full">Create account</button>
          </form>
        </div>
      )}
    </div>
  );
}
