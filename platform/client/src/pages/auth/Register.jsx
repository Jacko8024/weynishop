import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/auth.js';
import GoogleSignInButton from '../../components/GoogleSignInButton.jsx';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer', phone: '', shopName: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created');
      nav(`/${user.role}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-50 to-orange-100 p-4">
      <div className="card w-full max-w-md p-8">
        <Link to="/" className="flex items-center mb-6" aria-label="WeyniShop home">
          <img src="/logo/weynishop-full.png" alt="WeyniShop" style={{ height: 36 }} />
        </Link>
        <h1 className="text-2xl font-bold mb-1">Create account</h1>
        <p className="text-sm text-slate-500 mb-6">Sellers and delivery accounts await admin approval.</p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">I am a…</label>
            <div className="grid grid-cols-3 gap-2">
              {['buyer', 'seller', 'delivery'].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setForm({ ...form, role: r })}
                  className={`px-3 py-2 rounded-lg border text-sm capitalize ${
                    form.role === r ? 'border-brand-500 bg-brand-50 text-brand-700 font-medium' : 'border-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Full name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          {form.role === 'seller' && (
            <div>
              <label className="label">Shop name</label>
              <input className="input" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5 text-xs text-slate-400">
          <div className="flex-1 h-px bg-slate-200" />
          OR
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <GoogleSignInButton
          role={form.role}
          label={`Sign up with Google as ${form.role}`}
          onSuccess={(user) => {
            toast.success('Account ready');
            nav(`/${user.role}`, { replace: true });
          }}
        />
        <div className="mt-6 text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-brand-600 font-medium">Log in</Link>
        </div>
      </div>
    </div>
  );
}
