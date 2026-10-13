import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Mail, KeyRound, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api/client.js';

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP & new password
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleSendCode = async (e) => {
    e?.preventDefault();
    if (!email || !email.trim()) {
      toast.error(t('auth.emailRequired') || 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success(data.message || 'Verification code sent to your email');
      setStep(2);
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!otp || otp.trim().length < 6) {
      toast.error(t('auth.otpRequired') || 'Please enter the 6-digit verification code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error(t('auth.passwordLength') || 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordMismatch') || 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      toast.success(data.message || 'Password reset successfully!');
      onClose();
      setStep(1);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl border bg-white dark:bg-slate-900 overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {step === 1 ? 'Forgot Password' : 'Reset Password'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Request Code */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="mt-5 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enter your account's email address and we'll send you a 6-digit verification code to reset your password.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input pl-10 h-12 w-full rounded-xl"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 text-sm font-semibold rounded-xl mt-2"
            >
              {loading ? 'Sending Code…' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP & Enter New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 text-xs text-orange-800 dark:orange-300">
              We sent a 6-digit code to <strong>{email}</strong>. Check your inbox (or spam folder).
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="input pl-10 h-12 w-full rounded-xl tracking-widest font-mono text-lg font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input pr-10 h-12 w-full rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="input h-12 w-full rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 text-sm font-semibold rounded-xl mt-2"
            >
              {loading ? 'Resetting Password…' : 'Save New Password'}
            </button>

            <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
              <span>Didn't receive code?</span>
              <button
                type="button"
                disabled={resendCooldown > 0 || loading}
                onClick={handleSendCode}
                className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
                style={{ color: 'var(--color-brand)' }}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
