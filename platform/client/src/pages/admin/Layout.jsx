import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Map, AlertCircle, Settings, DollarSign } from 'lucide-react';
import PortalShell from '../../components/PortalShell.jsx';

export default function AdminLayout() {
  return (
    <PortalShell
      title="Admin"
      showStorefrontLink
      nav={[
        { to: '/admin', label: 'Overview', end: true, icon: <LayoutDashboard size={18} /> },
        { to: '/admin/users', label: 'Users', icon: <Users size={18} /> },
        { to: '/admin/live', label: 'Live map', icon: <Map size={18} /> },
        { to: '/admin/disputes', label: 'Disputes', icon: <AlertCircle size={18} /> },
        { to: '/admin/commission', label: 'Commission', icon: <DollarSign size={18} /> },
        { to: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
      ]}
    >
      <Outlet />
    </PortalShell>
  );
}
