import { Outlet } from 'react-router-dom';
import PublicNavbar from '../../components/PublicNavbar.jsx';

export default function BuyerLayout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <PublicNavbar />
      <main className="flex-1 max-w-page mx-auto w-full px-3 md:px-4 py-4 md:py-6">
        <Outlet />
      </main>
    </div>
  );
}
