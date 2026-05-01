import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/auth.js';
import GoogleSignInButton from '../../components/GoogleSignInButton.jsx';
import AnimatedCharacters from '../../components/AnimatedCharacters.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [typing, setTyping] = useState(false);

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
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left — animated characters (desktop only) */}
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden text-white"
           style={{ background: 'linear-gradient(135deg, #FF8A4C 0%, #EC5C2C 50%, #B83E1A 100%)' }}>
        <Link to="/" className="relative z-20 inline-flex items-center gap-2" aria-label="WeyniShop home">
          <img src="/logo/weynishop-full.png" alt="WeyniShop"
               style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
        </Link>

        <div className="relative z-20 flex items-end justify-center">
          <AnimatedCharacters
            typing={typing}
            hasPassword={form.password.length > 0}
            showPassword={showPassword}
          />
        </div>

        <div className="relative z-20 flex items-center gap-6 text-sm text-white/70">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center mb-10" aria-label="WeyniShop home">
            <img src="/logo/weynishop-full.png" alt="WeyniShop" style={{ height: 40 }} />
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back!</h1>
            <p className="text-sm text-slate-500">Please enter your details</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                className="input h-12"
                type="email"
                required
                value={form.email}
                placeholder="you@example.com"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setTyping(true)}
                onBlur={() => setTyping(false)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  className="input h-12 pr-12"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  placeholder="••••••••"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setTyping(true)}
                  onBlur={() => setTyping(false)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button className="btn-primary w-full h-12 text-base mt-1" disabled={loading}>
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" />
            OR
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <GoogleSignInButton
            onSuccess={(user) => {
              toast.success(`Welcome, ${user.name}`);
              nav(`/${user.role}`, { replace: true });
            }}
          />

          <div className="mt-6 text-sm">
            <div className="text-slate-500 mb-2">Quick demo logins:</div>
            <div className="flex flex-wrap gap-2">
              {['buyer', 'seller', 'delivery', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className="btn-secondary text-xs py-1 px-2 capitalize"
                  onClick={() => setRoleDemo(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-slate-600 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
