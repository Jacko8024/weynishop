import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../store/auth.js';

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL || '/';

export default function PortalShell({
  title,
  color = 'brand',
  nav,
  children,
  mobileBottom = false,
  showStorefrontLink = false,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="." className="flex items-center gap-2 font-bold">
            <img src="/logo/weynishop-icon.png" alt="WeyniShop" className="w-8 h-8" />
            <span>WeyniShop <span className="text-xs font-normal text-slate-500">{title}</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {showStorefrontLink && (
              <a
                href={STOREFRONT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm hidden sm:inline-flex"
                title="Open public storefront in a new tab"
              >
                <ExternalLink size={14} /> Go to Website
              </a>
            )}
            <span className="hidden sm:block text-sm text-slate-600">{user?.name}</span>
            <button onClick={handleLogout} className="btn-ghost" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 py-6 ${mobileBottom ? 'pb-24 md:pb-6' : ''}`}>
        {children}
      </main>

      {showStorefrontLink && (
        <div className="border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between text-sm">
            <span className="text-slate-500">Logged in as {user?.name} · {title}</span>
            <a
              href={STOREFRONT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-brand-700 hover:underline font-medium"
            >
              <ExternalLink size={14} /> Go to Website
            </a>
          </div>
        </div>
      )}

      {mobileBottom && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30">
          <div className="grid grid-cols-3">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-2 text-xs ${
                    isActive ? 'text-brand-600' : 'text-slate-500'
                  }`
                }
              >
                {n.icon}
                <span>{n.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
