import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import MapView, { AddressPicker } from '../../components/MapView.jsx';

export default function SellerProfile() {
  const { user, refreshMe } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [shopName, setShopName] = useState(user?.shopName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pin, setPin] = useState(
    user?.pickupLocation?.coordinates
      ? { lat: user.pickupLocation.coordinates[1], lng: user.pickupLocation.coordinates[0], address: user.pickupLocation.address }
      : null
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/users/me', {
        name, shopName, phone,
        pickupLocation: pin ? { coordinates: [pin.lng, pin.lat], address: pin.address || '' } : undefined,
      });
      await refreshMe();
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-5 space-y-3">
        <h2 className="font-bold">Profile</h2>
        <div><label className="label">Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">Shop name</label><input className="input" value={shopName} onChange={(e) => setShopName(e.target.value)} /></div>
        <div><label className="label">Phone</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      <div>
        <h2 className="font-bold mb-2">Pickup location</h2>
        <AddressPicker defaultValue={pin?.address || ''} onChange={(v) => v.lat && setPin(v)} />
        <div className="text-xs text-slate-500 mt-1">Tap the map to drop a pin.</div>
        <div className="mt-3">
          <MapView
            height={320}
            center={pin ? { lat: pin.lat, lng: pin.lng } : undefined}
            markers={pin ? [{ key: 'p', position: { lat: pin.lat, lng: pin.lng } }] : []}
            onClick={(p) => setPin({ ...p, address: pin?.address || `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` })}
          />
        </div>
        {pin?.address && <div className="text-sm text-slate-600 mt-2">📍 {pin.address}</div>}
      </div>
    </div>
  );
}
