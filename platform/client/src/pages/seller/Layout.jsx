import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, MapPin, Receipt, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import PortalShell from '../../components/PortalShell.jsx';
import { getSocket } from '../../lib/socket.js';
import { api } from '../../api/client.js';

export default function SellerLayout() {
  const [surpriseAllowed, setSurpriseAllowed] = useState(false);

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onNotify = (n) => {
      if (n.type === 'order:new') toast.success('New order received!');
      if (n.type === 'delivery:assigned') toast('Delivery assigned to your order');
    };
    s.on('notify', onNotify);
    return () => s.off('notify', onNotify);
  }, []);

  useEffect(() => {
    api.get('/surprise/access')
      .then(({ data }) => setSurpriseAllowed(!!data.allowed))
      .catch(() => {});
  }, []);

  const nav = [
    { to: '/seller', label: 'Dashboard', end: true, icon: <LayoutDashboard size={18} /> },
    { to: '/seller/products', label: 'Products', icon: <Package size={18} /> },
    { to: '/seller/orders', label: 'Orders', icon: <ClipboardList size={18} /> },
    { to: '/seller/profile', label: 'Profile', icon: <MapPin size={18} /> },
    { to: '/seller/commission', label: 'Commission', icon: <Receipt size={18} /> },
  ];
  if (surpriseAllowed) {
    nav.push({ to: '/seller/surprise', label: 'Surprise', icon: <Gift size={18} /> });
  }

  return (
    <PortalShell title="Seller" showStorefrontLink nav={nav}>
      <Outlet />
    </PortalShell>
  );
}
