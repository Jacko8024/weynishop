import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { Check, X, ChevronDown, ChevronRight, MapPin, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['vendors', 'delivery'];

const isImageUrl = (url) => /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url) || /^data:image\//.test(url);

function DocPreview({ label, url }) {
  if (!url) return null;
  return (
    <div>
      <span className="text-xs text-slate-400 block mb-1">{label}</span>
      {isImageUrl(url) ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={label} className="max-w-[240px] max-h-[180px] rounded-lg border object-cover cursor-pointer hover:opacity-90 transition" />
        </a>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand-600 hover:underline text-sm bg-slate-50 px-3 py-2 rounded-lg border">
          <FileText size={16} /> Open document
        </a>
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

export default function AdminPendingRequests() {
  const [tab, setTab] = useState('vendors');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isVendor = tab === 'vendors';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Pending Approvals</h1>
        <p className="text-sm text-slate-500">Review and approve vendor &amp; delivery onboarding requests.</p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
              tab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 size={24} className="animate-spin mr-2" /> Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">No pending {tab} requests.</div>
      ) : (
        <div className="card divide-y overflow-hidden">
          {items.map((u) => {
            const profile = isVendor ? u.vendorProfile : u.deliveryProfile;
            const open = expanded[u.id];
            return (
              <div key={u.id}>
                {/* Compact row — always visible */}
                <div
                  onClick={() => toggleExpand(u.id)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
                    {u.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{u.name}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <span className="badge bg-amber-100 text-amber-700 text-[11px] shrink-0">
                    {isVendor ? 'Vendor' : 'Delivery'}
                  </span>
                  {open ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                </div>

                {/* Expanded details */}
                {open && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                    {isVendor && profile ? (
                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                          <InfoRow label="Shop name" value={u.shopName} />
                          <InfoRow label="Owner name" value={profile.ownerName} />
                          <InfoRow label="Category" value={profile.shopCategory} />
                          <InfoRow label="Phone" value={profile.phoneNumber} />
                          <InfoRow label="Bank" value={profile.bankName} />
                          <InfoRow label="Account" value={profile.accountNumber} />
                          <InfoRow label="Email" value={u.email} />
                          <div className="text-xs text-slate-400">
                            Registered <span className="font-medium">{new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          {profile.tinOrLicenseUrl && <DocPreview label="TIN / License" url={profile.tinOrLicenseUrl} />}
                          {profile.shopPhotoUrl && <DocPreview label="Shop photo" url={profile.shopPhotoUrl} />}
                        </div>

                        {profile.latitude != null && profile.longitude != null && (
                          <a href={`https://www.google.com/maps?q=${profile.latitude},${profile.longitude}`}
                             target="_blank" rel="noopener noreferrer"
                             className="inline-flex items-center gap-1 text-brand-600 hover:underline text-xs">
                            <MapPin size={13} /> {profile.latitude}, {profile.longitude}
                          </a>
                        )}
                      </div>
                    ) : profile ? (
                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                          <InfoRow label="Full name" value={profile.fullName} />
                          <InfoRow label="Phone" value={profile.phoneNumber} />
                          <InfoRow label="Vehicle" value={profile.vehicleType} />
                          {profile.vehicleType !== 'cycle' && <InfoRow label="Plate number" value={profile.plateNumber} />}
                          <InfoRow label="Email" value={u.email} />
                          <div className="text-xs text-slate-400">
                            Registered <span className="font-medium">{new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-500 mb-2">Guarantor</div>
                          <div className="grid sm:grid-cols-3 gap-3 text-sm">
                            <InfoRow label="Name" value={profile.guarantorName} />
                            <InfoRow label="Phone" value={profile.guarantorPhone} />
                            <InfoRow label="Address" value={profile.guarantorAddress} />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4">
                          {profile.profilePhotoUrl && <DocPreview label="Profile photo" url={profile.profilePhotoUrl} />}
                          {profile.licenseOrIdUrl && (
                            <DocPreview
                              label={profile.vehicleType === 'cycle' ? 'National ID' : "Driver's license"}
                              url={profile.licenseOrIdUrl}
                            />
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Action buttons — only in expanded view */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button onClick={() => handleAction(u.id, 'approve')}
                              disabled={actionId === u.id}
                              className="btn-primary text-sm flex items-center gap-1">
                        {actionId === u.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Approve
                      </button>
                      <button onClick={() => { setRejectingUser(u); setRejectReason(''); }}
                              className="btn-danger text-sm flex items-center gap-1">
                        <X size={14} /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rejectingUser && (
        <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4"
             onClick={() => setRejectingUser(null)}>
          <div onClick={(e) => e.stopPropagation()}
               className="card p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">
                Reject <span className="text-slate-500 font-normal">{rejectingUser.name}</span>
              </h2>
              <button type="button" onClick={() => setRejectingUser(null)} className="btn-ghost"><X size={18} /></button>
            </div>
            <div>
              <label className="label">Reason for rejection</label>
              <textarea className="input" rows={4}
                        placeholder="Explain why this application was rejected. The applicant will see this message."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejectingUser(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={async () => {
                setActionId(rejectingUser.id);
                try {
                  await api.put(`/admin/users/${rejectingUser.id}/reject`, { reason: rejectReason });
                  toast.success('User rejected');
                  setItems((prev) => prev.filter((u) => u.id !== rejectingUser.id));
                  setRejectingUser(null);
                } catch (err) {
                  toast.error(err.response?.data?.message || 'Failed to reject');
                } finally {
                  setActionId(null);
                }
              }} disabled={actionId === rejectingUser.id}
                      className="btn-danger text-sm flex items-center gap-1">
                {actionId === rejectingUser.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
