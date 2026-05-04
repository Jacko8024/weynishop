import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, MapPin, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import PortalShell from '../../components/PortalShell.jsx';
import { getSocket } from '../../lib/socket.js';

export default function SellerLayout() {
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

  return (
    <PortalShell
      title="Seller"
      showStorefrontLink
      nav={[
        { to: '/seller', label: 'Dashboard', end: true, icon: <LayoutDashboard size={18} /> },
        { to: '/seller/products', label: 'Products', icon: <Package size={18} /> },
        { to: '/seller/orders', label: 'Orders', icon: <ClipboardList size={18} /> },
        { to: '/seller/profile', label: 'Profile', icon: <MapPin size={18} /> },
        { to: '/seller/commission', label: 'Commission', icon: <Receipt size={18} /> },
      ]}
    >
      <Outlet />
    </PortalShell>
  );
}
