import { Link } from 'react-router-dom';
import { Clock, Mail, LogOut, XCircle } from 'lucide-react';
import { useAuth } from '../../store/auth.js';
import { useTranslation } from 'react-i18next';

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const isRejected = user?.status === 'rejected';
  const rejectionReason = user?.rejectionReason || '';

  const roleLabel = user?.role === 'seller' ? 'Vendor' : 'Delivery Driver';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isRejected ? 'bg-gradient-to-br from-red-50 to-orange-50' : 'bg-gradient-to-br from-orange-50 to-amber-50'}`}>
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-200/50 p-8 md:p-10 space-y-6">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${isRejected ? 'bg-red-100' : 'bg-amber-100'}`}>
            {isRejected ? <XCircle size={40} className="text-red-500" /> : <Clock size={40} className="text-amber-600" />}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">
              {isRejected ? 'Account Not Approved' : 'Account Under Review'}
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              {isRejected ? (
                <>Your {roleLabel} registration was not approved.</>
              ) : (
                <>Your {roleLabel} account is currently being verified by the{' '}
                <strong className="text-slate-800">{t('brand.name')}</strong> Admin team.
                You will receive access once your documents are approved.</>
              )}
            </p>
            {isRejected && rejectionReason && (
              <div className="bg-red-50 rounded-xl p-4 text-left text-sm text-red-800 space-y-2">
                <div className="font-semibold">Reason:</div>
                <p className="text-red-700 whitespace-pre-wrap">{rejectionReason}</p>
              </div>
            )}
          </div>

          {isRejected ? (
            <div className="bg-red-50 rounded-xl p-4 text-left text-sm text-slate-700 space-y-2">
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-red-500 shrink-0" />
                <span>You can re-register with corrected information.</span>
              </div>
            </div>
          ) : (
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
          )}

          <p className="text-xs text-slate-400">
            Questions? Email{' '}
            <a href="mailto:support@weynishopping.com" className="text-brand-600 hover:underline">
              support@weynishopping.com
            </a>
          </p>

          <div className="flex flex-col gap-2">
            <button onClick={() => { logout(); }}
              className="btn-ghost w-full justify-center text-sm text-slate-600 hover:text-red-600">
              <LogOut size={16} /> Sign out
            </button>
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 underline">
              Back to {t('brand.name')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
