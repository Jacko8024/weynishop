import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag, Store, Truck, Camera, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../store/auth.js';
import { api } from '../../api/client.js';
import GoogleSignInButton from '../../components/GoogleSignInButton.jsx';
import AnimatedCharacters from '../../components/AnimatedCharacters.jsx';

const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const passwordStrength = (pw) => {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const map = [
    { label: 'Too short', color: 'bg-red-400' },
    { label: 'Weak', color: 'bg-orange-400' },
    { label: 'Fair', color: 'bg-yellow-400' },
    { label: 'Good', color: 'bg-lime-500' },
    { label: 'Strong', color: 'bg-emerald-500' },
    { label: 'Excellent', color: 'bg-emerald-600' },
  ];
  return { score, ...map[Math.min(score, map.length - 1)] };
};

const ROLE_OPTIONS = [
  {
    value: 'buyer',
    title: 'Buyer',
    desc: 'Shop products and order home delivery.',
    icon: ShoppingBag,
  },
  {
    value: 'seller',
    title: 'Seller',
    desc: 'List products and reach more customers.',
    icon: Store,
  },
  {
    value: 'delivery',
    title: 'Delivery',
    desc: 'Pick up orders and earn on every delivery.',
    icon: Truck,
  },
];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'buyer',
    shopName: '',
    password: '',
    confirmPassword: '',
    photoUrl: '',
    agree: false,
  });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [typing, setTyping] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const strength = passwordStrength(form.password);

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email) e.email = 'Required';
    else if (!emailRx.test(form.email)) e.email = 'Invalid email address';
    if (form.phone && !/^[+\d\s()-]{6,}$/.test(form.phone)) e.phone = 'Invalid phone';
    if (!form.password) e.password = 'Required';
    else if (strength.score < 2) e.password = 'Password is too weak';
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    if (!form.agree) e.agree = 'You must accept the terms';
    if (form.role === 'seller' && !form.shopName.trim()) e.shopName = 'Shop name is required';
    return e;
  }, [form, strength.score]);

  const isValid = Object.keys(errors).length === 0;

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast.error('Choose an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5 MB image');
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await api.post('/uploads/avatars', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ photoUrl: data.url });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true, agree: true, shopName: true });
    if (!isValid) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setLoading(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        shopName: form.shopName.trim(),
        password: form.password,
        photoUrl: form.photoUrl || undefined,
      });
      toast.success(`Welcome, ${user.name}!`);
      nav(`/${user.role}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left — animated brand panel (desktop only) */}
      <div
        className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #FF8A4C 0%, #EC5C2C 50%, #B83E1A 100%)' }}
      >
        <Link to="/" className="relative z-20 inline-flex items-center gap-2" aria-label="WeyniShop home">
          <img src="/logo/weynishop-full.png" alt="WeyniShop" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
        </Link>

        <div className="relative z-20 flex items-end justify-center">
          <AnimatedCharacters
            typing={typing}
            hasPassword={form.password.length > 0}
            showPassword={showPassword}
          />
        </div>

        <div className="relative z-20 space-y-1 text-sm">
          <p className="text-white/85 text-base font-medium">Join WeyniShop in under a minute.</p>
          <p className="text-white/65 max-w-md">Buy, sell or deliver in your neighbourhood — your role unlocks the right tools automatically.</p>
        </div>

        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-xl">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center justify-center mb-8" aria-label="WeyniShop home">
            <img src="/logo/weynishop-full.png" alt="WeyniShop" style={{ height: 40 }} />
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-1">Create your account</h1>
            <p className="text-sm text-slate-500">It only takes a minute. Sellers and couriers go through a quick admin approval.</p>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            {/* Role cards */}
            <div>
              <label className="label">I am a…</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                {ROLE_OPTIONS.map((r) => {
                  const Icon = r.icon;
                  const active = form.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => set({ role: r.value })}
                      className={`relative text-left rounded-xl border p-3 transition-all ${
                        active
                          ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-200 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`size-8 rounded-lg flex items-center justify-center mb-2 ${
                        active ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <div className="font-semibold text-sm">{r.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                      {active && (
                        <CheckCircle2 size={16} className="absolute top-2 right-2 text-brand-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo + name row */}
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickPhoto}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative size-20 rounded-2xl border border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/40 transition-colors flex items-center justify-center overflow-hidden bg-slate-50"
                  aria-label="Upload profile photo"
                  disabled={uploadingPhoto}
                >
                  {form.photoUrl ? (
                    <>
                      <img src={form.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); set({ photoUrl: '' }); }}
                        className="absolute -top-1 -right-1 size-6 rounded-full bg-white shadow border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-500"
                        aria-label="Remove photo"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : uploadingPhoto ? (
                    <span className="text-[10px] text-slate-500">Uploading…</span>
                  ) : (
                    <Camera size={22} className="text-slate-400" />
                  )}
                </button>
                <div className="text-[10px] text-slate-500 text-center mt-1">Photo (optional)</div>
              </div>
              <div className="flex-1">
                <Field
                  label="Full name"
                  value={form.name}
                  onChange={(v) => set({ name: v })}
                  onBlur={() => touch('name')}
                  onFocus={() => setTyping(true)}
                  onLeave={() => setTyping(false)}
                  error={touched.name && errors.name}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {form.role === 'seller' && (
              <Field
                label="Shop name"
                value={form.shopName}
                onChange={(v) => set({ shopName: v })}
                onBlur={() => touch('shopName')}
                onFocus={() => setTyping(true)}
                onLeave={() => setTyping(false)}
                error={touched.shopName && errors.shopName}
                placeholder="e.g. Awash Spices"
                required
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => set({ email: v })}
                onBlur={() => touch('email')}
                onFocus={() => setTyping(true)}
                onLeave={() => setTyping(false)}
                error={touched.email && errors.email}
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
              <Field
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(v) => set({ phone: v })}
                onBlur={() => touch('phone')}
                onFocus={() => setTyping(true)}
                onLeave={() => setTyping(false)}
                error={touched.phone && errors.phone}
                autoComplete="tel"
                placeholder="+251…"
              />
            </div>

            {/* Password + strength */}
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  className={`input h-12 pr-12 ${touched.password && errors.password ? 'border-red-300' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => set({ password: e.target.value })}
                  onBlur={() => touch('password')}
                  onFocus={() => setTyping(true)}
                  onMouseLeave={() => setTyping(false)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all ${strength.color}`}
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 w-16 text-right">{strength.label}</span>
                </div>
              )}
              {touched.password && errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="confirm">Confirm password</label>
              <div className="relative">
                <input
                  id="confirm"
                  className={`input h-12 pr-12 ${touched.confirmPassword && errors.confirmPassword ? 'border-red-300' : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={(e) => set({ confirmPassword: e.target.value })}
                  onBlur={() => touch('confirmPassword')}
                  onFocus={() => setTyping(true)}
                  onMouseLeave={() => setTyping(false)}
                  placeholder="Re-type your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.agree}
                onChange={(e) => { set({ agree: e.target.checked }); touch('agree'); }}
              />
              <span className="text-slate-600">
                I agree to the{' '}
                <Link to="/terms" className="text-brand-600 hover:underline font-medium">Terms &amp; Conditions</Link>{' '}
                and the{' '}
                <Link to="/privacy" className="text-brand-600 hover:underline font-medium">Privacy Policy</Link>.
              </span>
            </label>
            {touched.agree && errors.agree && (
              <p className="text-xs text-red-500 -mt-2">{errors.agree}</p>
            )}

            <button className="btn-primary w-full h-12 text-base" disabled={loading || !isValid}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" />
            OR
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <GoogleSignInButton
            role={form.role}
            label={`Sign up with Google as ${form.role}`}
            onSuccess={(user) => {
              toast.success(`Welcome, ${user.name}!`);
              nav(`/${user.role}`, { replace: true });
            }}
          />

          <div className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable labelled input with inline error / focus tracking.
 * Uses the existing `.input` and `.label` utility classes for visual consistency.
 */
function Field({
  label, type = 'text', value, onChange, onBlur, onFocus, onLeave, error,
  required = false, autoComplete, placeholder,
}) {
  return (
    <div>
      <label className="label">{label}{required && <span className="text-red-500"> *</span>}</label>
      <input
        className={`input h-12 ${error ? 'border-red-300' : ''}`}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
        onMouseLeave={onLeave}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

