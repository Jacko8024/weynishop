import { Link } from 'react-router-dom';
import { Clock, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../../store/auth.js';

export default function PendingApproval() {
  const { user, logout } = useAuth();

  const roleLabel = user?.role === 'seller' ? 'Vendor' : 'Delivery Driver';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-200/50 p-8 md:p-10 space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock size={40} className="text-amber-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Account Under Review
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Your {roleLabel} account is currently being verified by the{' '}
              <strong className="text-slate-800">Weyni Shopping</strong> Admin team.
              You will receive access once your documents are approved.
            </p>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 text-left text-sm text-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-amber-500 shrink-0" />
              <span>Check your email (including spam) for updates</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-amber-500 shrink-0" />
              <span>Approval typically takes 1–2 business days</span>
            </div>
            <div className="flex items-center gap-2">
              <LogOut size={15} className="text-amber-500 shrink-0" />
              <span>You can safely close this page and check back later</span>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Questions? Email{' '}
            <a href="mailto:support@weynishopping.com" className="text-brand-600 hover:underline">
              support@weynishopping.com
            </a>
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => { logout(); }}
              className="btn-ghost w-full justify-center text-sm text-slate-600 hover:text-red-600"
            >
              <LogOut size={16} /> Sign out
            </button>
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 underline">
              Back to WeyniShopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
