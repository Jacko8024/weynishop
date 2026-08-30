import { Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Map, AlertCircle, Settings, Coins, DollarSign, Image, Tags,
  ClipboardCheck, Package, Gift, Candy,
} from 'lucide-react';
import PortalShell from '../../components/PortalShell.jsx';

/**
 * Admin portal (spec §28 desktop redesign).
 *
 * Desktop md+ renders a grouped fixed sidebar (Dashboard / Catalog / Orders
 * & Ops / Users / Surprise / Finance / Settings). Every entry points to an
 * EXISTING route — no invented destinations (spec §28: "Keep existing admin
 * routes/functionality"). Small screens keep the hamburger drawer, which now
 * shows the same grouped structure.
 */
export default function AdminLayout() {
  return (
    <PortalShell
      title="Admin"
      showStorefrontLink
      navGroups={[
        {
          title: '',
          items: [
            { to: '/admin', label: 'Dashboard', end: true, icon: <LayoutDashboard size={18} /> },
          ],
        },
        {
          title: 'Catalog',
          items: [
            { to: '/admin/products', label: 'Products', icon: <Package size={18} /> },
            { to: '/admin/categories', label: 'Categories', icon: <Tags size={18} /> },
            { to: '/admin/banners', label: 'Banners', icon: <Image size={18} /> },
          ],
        },
        {
          title: 'Orders & Ops',
          items: [
            { to: '/admin/live', label: 'Live map', icon: <Map size={18} /> },
            { to: '/admin/disputes', label: 'Disputes', icon: <AlertCircle size={18} /> },
            { to: '/admin/pending', label: 'Pending approvals', icon: <ClipboardCheck size={18} /> },
          ],
        },
        {
          title: 'Users',
          items: [
            { to: '/admin/users', label: 'All users', icon: <Users size={18} /> },
          ],
        },
        {
          title: 'Surprise',
          items: [
            { to: '/admin/surprise', label: 'Bookings', icon: <Gift size={18} /> },
            { to: '/admin/surprise/services', label: 'Services', icon: <Candy size={18} /> },
          ],
        },
        {
          title: 'Finance',
          items: [
            { to: '/admin/commission', label: 'Commission', icon: <DollarSign size={18} /> },
            { to: '/admin/currency', label: 'Currency', end: true, icon: <Coins size={18} /> },
          ],
        },
        {
          title: 'Settings',
          items: [
            { to: '/admin/settings', label: 'General', icon: <Settings size={18} /> },
          ],
        },
      ]}
    >
      <Outlet />
    </PortalShell>
  );
}
