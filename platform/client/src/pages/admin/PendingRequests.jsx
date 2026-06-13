import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Check, X, ExternalLink, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['vendors', 'delivery'];

export default function AdminPendingRequests() {
  const [tab, setTab] = useState('vendors');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/pending/${tab}`);
      setItems(data.items || []);
    } catch {
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const handleAction = async (userId, action) => {
    setActionId(userId);
    try {
      const label = action === 'approve' ? 'approved' : 'rejected';
      await api.put(`/admin/users/${userId}/${action}`);
      toast.success(`User ${label} successfully`);
      setItems((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} user`);
    } finally {
      setActionId(null);
    }
  };

  const isVendor = tab === 'vendors';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Pending Approvals</h1>
        <p className="text-sm text-slate-500">Review and approve vendor &amp; delivery onboarding requests.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              tab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          No pending {tab} requests.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((u) => {
            const profile = isVendor ? u.vendorProfile : u.deliveryProfile;
            const roleLabel = isVendor ? 'Vendor' : 'Delivery';
            return (
              <div key={u.id} className="card p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-lg font-bold text-amber-700">
                      {u.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email} · Joined {new Date(u.createdAt).toLocaleDateString()}</div>
                      <span className="badge bg-amber-100 text-amber-700 text-[11px] mt-1">{roleLabel} · Pending</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(u.id, 'approve')}
                      disabled={actionId === u.id}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      {actionId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(u.id, 'reject')}
                      disabled={actionId === u.id}
                      className="btn-danger text-sm flex items-center gap-1"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>

                {isVendor && profile && (
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <InfoRow label="Shop name" value={u.shopName} />
                    <InfoRow label="Owner name" value={profile.ownerName} />
                    <InfoRow label="Category" value={profile.shopCategory} />
                    <InfoRow label="Phone" value={profile.phoneNumber} />
                    <InfoRow label="Bank" value={profile.bankName} />
                    <InfoRow label="Account" value={profile.accountNumber} />
                    {profile.tinOrLicenseUrl && (
                      <DocLink label="TIN / License" url={profile.tinOrLicenseUrl} />
                    )}
                    {profile.shopPhotoUrl && (
                      <DocLink label="Shop photo" url={profile.shopPhotoUrl} />
                    )}
                    {profile.latitude != null && profile.longitude != null && (
                      <div className="sm:col-span-2">
                        <span className="text-xs text-slate-400 block mb-0.5">Location</span>
                        <a
                          href={`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand-600 hover:underline text-xs"
                        >
                          <MapPin size={13} />
                          {profile.latitude}, {profile.longitude}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {!isVendor && profile && (
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <InfoRow label="Full name" value={profile.fullName} />
                    <InfoRow label="Phone" value={profile.phoneNumber} />
                    <InfoRow label="Vehicle" value={profile.vehicleType} />
                    {profile.vehicleType !== 'cycle' && (
                      <InfoRow label="Plate number" value={profile.plateNumber} />
                    )}
                    <div className="sm:col-span-2 border-t border-slate-100 pt-3 mt-1">
                      <div className="text-xs font-semibold text-slate-500 mb-2">Guarantor</div>
                      <InfoRow label="Name" value={profile.guarantorName} />
                      <InfoRow label="Phone" value={profile.guarantorPhone} />
                      <InfoRow label="Address" value={profile.guarantorAddress} />
                    </div>
                    {profile.profilePhotoUrl && (
                      <DocLink label="Profile photo" url={profile.profilePhotoUrl} />
                    )}
                    {profile.licenseOrIdUrl && (
                      <DocLink
                        label={profile.vehicleType === 'cycle' ? 'National ID' : "Driver's license"}
                        url={profile.licenseOrIdUrl}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-slate-400 block">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function DocLink({ label, url }) {
  return (
    <div>
      <span className="text-xs text-slate-400 block">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-brand-600 hover:underline text-sm"
      >
        <ExternalLink size={13} /> View document
      </a>
    </div>
  );
}
