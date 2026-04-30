import { Outlet } from 'react-router-dom';
import { Inbox, Truck, History } from 'lucide-react';
import PortalShell from '../../components/PortalShell.jsx';

export default function DeliveryLayout() {
  return (
    <PortalShell
      title="Delivery"
      mobileBottom
      nav={[
        { to: '/delivery', label: 'Available', end: true, icon: <Inbox size={18} /> },
        { to: '/delivery/active', label: 'Active', icon: <Truck size={18} /> },
        { to: '/delivery/history', label: 'History', icon: <History size={18} /> },
      ]}
    >
      <Outlet />
    </PortalShell>
  );
}
