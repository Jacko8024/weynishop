import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, ShoppingBag, Store, Truck, Camera, X, CheckCircle2,
  MapPin, Upload,
} from 'lucide-react';
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

const Field = ({ label, type = 'text', value, onChange, onBlur, error, required, placeholder, autoComplete, className = '', onFocus, onMouseLeave }) => (
  <div className={className}>
    <label className="label">{label}{required && <span className="text-red-500"> *</span>}</label>
    <input
      className={`input h-12 ${error ? 'border-red-300' : ''}`}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onFocus={onFocus}
      onMouseLeave={onMouseLeave}
      autoComplete={autoComplete}
      placeholder={placeholder}
      required={required}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const FileUploadBtn = ({ field, label, url, accept = 'image/*', uploading, docRef, doc2Ref, onUpload, onClear }) => (
  <div>
    <label className="label">{label}</label>
    <input ref={field === 'tinOrLicenseUrl' || field === 'licenseOrIdUrl' ? docRef : field === 'shopPhotoUrl' ? doc2Ref : null} type="file" accept={accept} className="hidden"
      onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onUpload(f, field); }}
    />
    <button type="button" onClick={() => {
      const ref = field === 'tinOrLicenseUrl' || field === 'licenseOrIdUrl' ? docRef : doc2Ref;
      ref.current?.click();
    }} disabled={uploading[field]} className="input h-12 flex items-center justify-between text-sm cursor-pointer hover:border-brand-400">
      {uploading[field] ? (
        <span className="text-slate-400">Uploading…</span>
      ) : url ? (
        <span className="text-green-600 truncate">✓ Uploaded</span>
      ) : (
        <span className="text-slate-400"><Upload size={14} className="inline mr-1" />Upload</span>
      )}
      {url && <button type="button" onClick={(e) => { e.stopPropagation(); onClear(field); }} className="text-red-500 hover:text-red-700"><X size={14} /></button>}
    </button>
    {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-brand-600 hover:underline block mt-0.5">View file</a>}
  </div>
);

const ROLE_OPTIONS = [
  { value: 'buyer', title: 'Buyer', desc: 'Shop products and order home delivery.', icon: ShoppingBag },
  { value: 'seller', title: 'Vendor', desc: 'List products and reach more customers.', icon: Store },
  { value: 'delivery', title: 'Delivery', desc: 'Pick up orders and earn on every delivery.', icon: Truck },
];

export default function Register() {
  const { login } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef(null);
  const docRef = useRef(null);
  const doc2Ref = useRef(null);

  const [shopCategories, setShopCategories] = useState([]);

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      setShopCategories(data.items || []);
    }).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: 'buyer', password: '', confirmPassword: '',
    photoUrl: '', agree: false,
    // Vendor fields
    ownerName: '', shopName: '', shopCategory: '', phoneNumber: '',
    tinOrLicenseUrl: '', shopPhotoUrl: '',
    latitude: '', longitude: '',
    bankName: '', accountNumber: '',
    // Delivery fields
    fullName: '', profilePhotoUrl: '', vehicleType: 'cycle',
    plateNumber: '', licenseOrIdUrl: '',
    guarantorName: '', guarantorPhone: '', guarantorAddress: '',
  });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({});
  const [typing, setTyping] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const strength = passwordStrength(form.password);
  const isVendor = form.role === 'seller';
  const isDelivery = form.role === 'delivery';
  const needsPlate = isDelivery && (form.vehicleType === 'motor' || form.vehicleType === 'car');

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
    if (isVendor) {
      if (!form.shopName.trim()) e.shopName = 'Shop name is required';
      if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
      if (!form.shopCategory) e.shopCategory = 'Select a category';
      if (!form.phoneNumber.trim()) e.phoneNumber = 'Phone number is required';
    }
    if (isDelivery) {
      if (!form.fullName.trim()) e.fullName = 'Full name is required';
      if (!form.phoneNumber.trim()) e.phoneNumber = 'Phone number is required';
      if (!form.guarantorName.trim()) e.guarantorName = 'Guarantor name is required';
      if (!form.guarantorPhone.trim()) e.guarantorPhone = 'Guarantor phone is required';
      if (needsPlate && !form.plateNumber.trim()) e.plateNumber = 'Plate number is required for motor/car';
      if (needsPlate && !form.licenseOrIdUrl) e.licenseOrIdUrl = "Driver's license is required";
      if (!needsPlate && !form.licenseOrIdUrl) e.licenseOrIdUrl = 'National ID is required';
    }
    return e;
  }, [form, strength.score, isVendor, isDelivery, needsPlate]);

  const isValid = Object.keys(errors).length === 0;

  // File upload helper
  const uploadFile = async (file, field) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast.error('Choose an image file');
    if (file.size > 2 * 1024 * 1024) return toast.error('Max 2 MB per file');
    setUploading((u) => ({ ...u, [field]: true }));
    try {
      const fd = new FormData();
      fd.append('document', file);
      const { data } = await api.post('/uploads/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ [field]: data.url });
    } catch (err) {
      toast.error(err.response?.data?.message || `${field} upload failed`);
    } finally {
      setUploading((u) => ({ ...u, [field]: false }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true, email: true, password: true, confirmPassword: true, agree: true,
      shopName: true, ownerName: true, shopCategory: true, phoneNumber: true,
      fullName: true, guarantorName: true, guarantorPhone: true, plateNumber: true,
    });
    if (!isValid) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setLoading(true);
    try {
      if (isVendor) {
        const { data } = await api.post('/auth/vendor-register', {
          name: form.name.trim(), email: form.email.trim(), password: form.password,
          phone: form.phone.trim(), ownerName: form.ownerName.trim(),
          shopName: form.shopName.trim(), shopCategory: form.shopCategory,
          phoneNumber: form.phoneNumber.trim(),
          tinOrLicenseUrl: form.tinOrLicenseUrl || '',
          shopPhotoUrl: form.shopPhotoUrl || '',
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
          bankName: form.bankName.trim(), accountNumber: form.accountNumber.trim(),
          agreedToTerms: true,
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        nav('/pending-approval', { replace: true });
      } else if (isDelivery) {
        const { data } = await api.post('/auth/delivery-register', {
          name: form.name.trim(), email: form.email.trim(), password: form.password,
          phone: form.phone.trim(), fullName: form.fullName.trim(),
          profilePhotoUrl: form.profilePhotoUrl || '',
          vehicleType: form.vehicleType,
          plateNumber: form.plateNumber.trim() || '',
          licenseOrIdUrl: form.licenseOrIdUrl || '',
          guarantorName: form.guarantorName.trim(),
          guarantorPhone: form.guarantorPhone.trim(),
          guarantorAddress: form.guarantorAddress.trim(),
          phoneNumber: form.phoneNumber.trim(),
          agreedToTerms: true,
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        nav('/pending-approval', { replace: true });
      } else {
        // Buyer: use existing register endpoint
        const { data } = await api.post('/auth/register', {
          name: form.name.trim(), email: form.email.trim(),
          phone: form.phone.trim(), role: 'buyer',
          password: form.password, photoUrl: form.photoUrl || undefined,
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        nav('/', { replace: true });
      }
      toast.success('Account created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="relative hidden lg:flex flex-col justify-between p-10 overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #FF8A4C 0%, #EC5C2C 50%, #B83E1A 100%)' }}>
        <Link to="/" className="relative z-20 inline-flex items-center gap-2" aria-label="WeyniShopping home">
          <img src="/logo/weynishopping-full.png" alt="WeyniShopping" style={{ height: 40, filter: 'brightness(0) invert(1)' }} />
        </Link>
        <div className="relative z-20 flex items-end justify-center">
          <AnimatedCharacters typing={typing} hasPassword={form.password.length > 0} showPassword={showPassword} />
        </div>
        <div className="relative z-20 space-y-1 text-sm">
          <p className="text-white/85 text-base font-medium">Join WeyniShopping in under a minute.</p>
          <p className="text-white/65 max-w-md">Buy, sell or deliver in your neighbourhood — your role unlocks the right tools automatically.</p>
        </div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="flex items-start justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-xl">
          <Link to="/" className="lg:hidden flex items-center justify-center mb-8" aria-label="WeyniShopping home">
            <img src="/logo/weynishopping-full.png" alt="WeyniShopping" style={{ height: 40 }} />
          </Link>

          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-1">Create your account</h1>
            <p className="text-sm text-slate-500">Sellers and couriers go through a quick admin approval.</p>
          </div>

          <form onSubmit={submit} noValidate className="space-y-4">
            {/* Role */}
            <div>
              <label className="label">I am a…</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                {ROLE_OPTIONS.map((r) => {
                  const Icon = r.icon;
                  const active = form.role === r.value;
                  return (
                    <button key={r.value} type="button" onClick={() => set({ role: r.value })}
                      className={`relative text-left rounded-xl border p-3 transition-all ${
                        active ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-200 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <div className={`size-8 rounded-lg flex items-center justify-center mb-2 ${active ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon size={16} />
                      </div>
                      <div className="font-semibold text-sm">{r.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                      {active && <CheckCircle2 size={16} className="absolute top-2 right-2 text-brand-500" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo + name */}
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]; e.target.value = '';
                    if (!file) return;
                    if (!/^image\//.test(file.type)) return toast.error('Choose an image file');
                    if (file.size > 5 * 1024 * 1024) return toast.error('Max 5 MB image');
                    setUploading((u) => ({ ...u, photo: true }));
                    const fd = new FormData(); fd.append('image', file);
                    api.post('/uploads/avatars', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                      .then(({ data }) => set({ photoUrl: data.url }))
                      .catch(() => toast.error('Photo upload failed'))
                      .finally(() => setUploading((u) => ({ ...u, photo: false })));
                  }}
                />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading.photo}
                  className="relative size-20 rounded-2xl border border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/40 transition-colors flex items-center justify-center overflow-hidden bg-slate-50"
                  aria-label="Upload profile photo">
                  {form.photoUrl ? (
                    <><img src={form.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <button type="button" onClick={(e) => { e.stopPropagation(); set({ photoUrl: '' }); }}
                        className="absolute -top-1 -right-1 size-6 rounded-full bg-white shadow border border-slate-200 flex items-center justify-center text-slate-600 hover:text-red-500"
                        aria-label="Remove photo"><X size={14} /></button>
                    </>
                  ) : uploading.photo ? <span className="text-[10px] text-slate-500">Uploading…</span>
                    : <Camera size={22} className="text-slate-400" />}
                </button>
                <div className="text-[10px] text-slate-500 text-center mt-1">Photo (optional)</div>
              </div>
              <div className="flex-1">
                <Field label="Full name" value={form.name} onChange={(v) => set({ name: v })}
                  onBlur={() => touch('name')} onFocus={() => setTyping(true)} onMouseLeave={() => setTyping(false)}
                  error={touched.name && errors.name} autoComplete="name" required />
              </div>
            </div>

            {/* ── VENDOR EXTRA FIELDS ── */}
            {isVendor && (
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <h3 className="font-semibold text-sm text-slate-700">Vendor Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Shop name" value={form.shopName} onChange={(v) => set({ shopName: v })}
                    onBlur={() => touch('shopName')} error={touched.shopName && errors.shopName} required />
                  <Field label="Owner full name" value={form.ownerName} onChange={(v) => set({ ownerName: v })}
                    onBlur={() => touch('ownerName')} error={touched.ownerName && errors.ownerName} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Shop category <span className="text-red-500"> *</span></label>
                      <select className={`input h-12 ${touched.shopCategory && errors.shopCategory ? 'border-red-300' : ''}`}
                        value={form.shopCategory} onChange={(e) => set({ shopCategory: e.target.value })}
                        onBlur={() => touch('shopCategory')}>
                        <option value="">Select…</option>
                        {shopCategories.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
                      </select>
                    {touched.shopCategory && errors.shopCategory && <p className="text-xs text-red-500 mt-1">{errors.shopCategory}</p>}
                  </div>
                  <Field label="Phone number" type="tel" value={form.phoneNumber} onChange={(v) => set({ phoneNumber: v })}
                    onBlur={() => touch('phoneNumber')} error={touched.phoneNumber && errors.phoneNumber}
                    placeholder="+251…" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FileUploadBtn field="tinOrLicenseUrl" label="Business License / TIN" url={form.tinOrLicenseUrl} uploading={uploading} docRef={docRef} doc2Ref={doc2Ref} onUpload={uploadFile} onClear={(f) => set({ [f]: '' })} />
                  <FileUploadBtn field="shopPhotoUrl" label="Shop front photo" url={form.shopPhotoUrl} uploading={uploading} docRef={docRef} doc2Ref={doc2Ref} onUpload={uploadFile} onClear={(f) => set({ [f]: '' })} />
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-slate-700 mb-2">Payout Info</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Bank name" value={form.bankName} onChange={(v) => set({ bankName: v })} />
                    <Field label="Account number" value={form.accountNumber} onChange={(v) => set({ accountNumber: v })} />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-slate-700 mb-2">Shop Location</h4>
                  <p className="text-xs text-slate-400 mb-2">Enter coordinates or use your current location.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Latitude" type="text" value={form.latitude} onChange={(v) => set({ latitude: v })}
                      placeholder="e.g. 9.0227" />
                    <Field label="Longitude" type="text" value={form.longitude} onChange={(v) => set({ longitude: v })}
                      placeholder="e.g. 38.7613" />
                  </div>
                  <button type="button" onClick={() => {
                    if (!navigator.geolocation) return toast.error('Geolocation not supported');
                    navigator.geolocation.getCurrentPosition(
                      (pos) => { set({ latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }); toast.success('Location captured'); },
                      () => toast.error('Could not get location')
                    );
                  }} className="btn-ghost text-xs mt-2 flex items-center gap-1">
                    <MapPin size={14} /> Use my current location
                  </button>
                </div>
              </div>
            )}

            {/* ── DELIVERY EXTRA FIELDS ── */}
            {isDelivery && (
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <h3 className="font-semibold text-sm text-slate-700">Delivery Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full name" value={form.fullName} onChange={(v) => set({ fullName: v })}
                    onBlur={() => touch('fullName')} error={touched.fullName && errors.fullName} required />
                  <Field label="Phone number" type="tel" value={form.phoneNumber} onChange={(v) => set({ phoneNumber: v })}
                    onBlur={() => touch('phoneNumber')} error={touched.phoneNumber && errors.phoneNumber}
                    placeholder="+251…" required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FileUploadBtn field="profilePhotoUrl" label="Profile photo" url={form.profilePhotoUrl} uploading={uploading} docRef={docRef} doc2Ref={doc2Ref} onUpload={uploadFile} onClear={(f) => set({ [f]: '' })} />
                  <div>
                    <label className="label">Vehicle type <span className="text-red-500"> *</span></label>
                    <div className="flex gap-2 mt-1">
                      {['cycle', 'motor', 'car'].map((v) => (
                        <button key={v} type="button" onClick={() => { set({ vehicleType: v, plateNumber: v === 'cycle' ? '' : form.plateNumber }); }}
                          className={`flex-1 h-12 rounded-lg border text-sm font-medium capitalize ${
                            form.vehicleType === v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {needsPlate && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Plate number" value={form.plateNumber} onChange={(v) => set({ plateNumber: v })}
                      onBlur={() => touch('plateNumber')} error={touched.plateNumber && errors.plateNumber}
                      placeholder="e.g. AA-12345" required />
                    <FileUploadBtn field="licenseOrIdUrl" label="Driver's License" url={form.licenseOrIdUrl} uploading={uploading} docRef={docRef} doc2Ref={doc2Ref} onUpload={uploadFile} onClear={(f) => set({ [f]: '' })} />
                  </div>
                )}
                {!needsPlate && isDelivery && (
                  <FileUploadBtn field="licenseOrIdUrl" label="National ID" url={form.licenseOrIdUrl} uploading={uploading} docRef={docRef} doc2Ref={doc2Ref} onUpload={uploadFile} onClear={(f) => set({ [f]: '' })} />
                )}

                <div className="border-t border-slate-200 pt-3">
                  <h4 className="font-semibold text-sm text-slate-700 mb-2">Guarantor Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Full name" value={form.guarantorName} onChange={(v) => set({ guarantorName: v })}
                      onBlur={() => touch('guarantorName')} error={touched.guarantorName && errors.guarantorName} required />
                    <Field label="Phone number" type="tel" value={form.guarantorPhone} onChange={(v) => set({ guarantorPhone: v })}
                      onBlur={() => touch('guarantorPhone')} error={touched.guarantorPhone && errors.guarantorPhone}
                      placeholder="+251…" required />
                    <Field label="Home address" value={form.guarantorAddress} onChange={(v) => set({ guarantorAddress: v })} />
                  </div>
                </div>
              </div>
            )}

            {/* Common fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email" type="email" value={form.email} onChange={(v) => set({ email: v })}
                onBlur={() => touch('email')} error={touched.email && errors.email}
                autoComplete="email" placeholder="you@example.com" required />
              {(isVendor || isDelivery) ? null : (
                <Field label="Phone" type="tel" value={form.phone} onChange={(v) => set({ phone: v })}
                  onBlur={() => touch('phone')} error={touched.phone && errors.phone}
                  autoComplete="tel" placeholder="+251…" />
              )}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input id="password" className={`input h-12 pr-12 ${touched.password && errors.password ? 'border-red-300' : ''}`}
                  type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => set({ password: e.target.value })} onBlur={() => touch('password')}
                  placeholder="At least 6 characters" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full transition-all ${strength.color}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-slate-500 w-16 text-right">{strength.label}</span>
                </div>
              )}
              {touched.password && errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="label" htmlFor="confirm">Confirm password</label>
              <div className="relative">
                <input id="confirm" className={`input h-12 pr-12 ${touched.confirmPassword && errors.confirmPassword ? 'border-red-300' : ''}`}
                  type={showConfirm ? 'text' : 'password'} required value={form.confirmPassword}
                  onChange={(e) => set({ confirmPassword: e.target.value })} onBlur={() => touch('confirmPassword')}
                  placeholder="Re-type your password" autoComplete="new-password" />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" className="mt-0.5" checked={form.agree}
                onChange={(e) => { set({ agree: e.target.checked }); touch('agree'); }} />
              <span className="text-slate-600">
                I agree to the{' '}
                <Link to="/terms" className="text-brand-600 hover:underline font-medium">Terms &amp; Conditions</Link>{' '}
                and the{' '}
                <Link to="/privacy" className="text-brand-600 hover:underline font-medium">Privacy Policy</Link>.
                {(isVendor || isDelivery) && <span className="text-red-500"> *</span>}
              </span>
            </label>
            {touched.agree && errors.agree && <p className="text-xs text-red-500 -mt-2">{errors.agree}</p>}

            <button className="btn-primary w-full h-12 text-base" disabled={loading || !isValid}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6 text-xs text-slate-400">
            <div className="flex-1 h-px bg-slate-200" /> OR <div className="flex-1 h-px bg-slate-200" />
          </div>

          <GoogleSignInButton role={form.role}
            label={`Sign up with Google as ${form.role}`}
            onSuccess={(user) => {
              if (user.status === 'pending') {
                nav('/pending-approval', { replace: true });
              } else {
                nav('/', { replace: true });
              }
            }} />

          <div className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
