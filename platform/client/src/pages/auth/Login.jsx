import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/auth.js';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome, ${user.name}`);
      nav(`/${user.role}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const setRoleDemo = (role) => {
    const demo = {
      buyer: { email: 'buyer@weynshop.test', password: 'Buyer@123' },
      seller: { email: 'seller@weynshop.test', password: 'Seller@123' },
      delivery: { email: 'delivery@weynshop.test', password: 'Delivery@123' },
      admin: { email: 'admin@weynshop.test', password: 'Admin@123' },
    }[role];
    setForm(demo);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-50 to-orange-100 p-4">
      <div className="card w-full max-w-md p-8">
        <Link to="/" className="flex items-center mb-6" aria-label="WeyniShop home">
          <img src="/logo/weynishop-full.png" alt="WeyniShop" style={{ height: 36 }} />
        </Link>
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="text-sm text-slate-500 mb-6">Your role is detected automatically.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="mt-5 text-sm">
          <div className="text-slate-500 mb-2">Quick demo logins:</div>
          <div className="flex flex-wrap gap-2">
            {['buyer', 'seller', 'delivery', 'admin'].map((r) => (
              <button key={r} className="btn-secondary text-xs py-1 px-2" onClick={() => setRoleDemo(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-sm text-slate-600">
          New here? <Link to="/register" className="text-brand-600 font-medium">Create account</Link>
        </div>
      </div>
    </div>
  );
}
