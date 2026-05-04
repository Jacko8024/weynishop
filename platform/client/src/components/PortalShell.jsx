import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ExternalLink, Menu, X } from 'lucide-react';
import { useAuth } from '../store/auth.js';

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL || '/';

/**
 * Shell used by the seller, delivery, and admin portals.
 *
 * Responsive behaviour:
 *  - md+ : top header with inline nav links.
 *  - <md : compact header + hamburger that opens a slide-in drawer with every
 *          nav item, the user info, and logout. Works for any nav length.
 *  - When `mobileBottom` is true (delivery uses this for its short 3-item nav),
 *    a bottom tab bar is also rendered. Its grid scales to nav.length so it
 *    works for any number of items, not just 3.
 */
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
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer whenever the route changes (so tapping a link dismisses it).
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ---------- Header ---------- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden btn-ghost p-2 -ml-1"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <Link to="." className="flex items-center gap-2 font-bold min-w-0">
              <img src="/logo/weynishop-icon.png" alt="WeyniShop" className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
              <span className="truncate">
                <span className="hidden sm:inline">WeyniShop </span>
                <span className="text-xs font-normal text-slate-500">{title}</span>
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1 flex-wrap">
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

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {showStorefrontLink && (
              <a
                href={STOREFRONT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm hidden lg:inline-flex"
                title="Open public storefront in a new tab"
              >
                <ExternalLink size={14} /> Go to Website
              </a>
            )}
            <span className="hidden lg:block text-sm text-slate-600 max-w-[140px] truncate">{user?.name}</span>
            <button onClick={handleLogout} className="btn-ghost p-2" title="Logout" aria-label="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Mobile drawer ---------- */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fadeIn"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white z-50 md:hidden flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200">
              <div className="flex items-center gap-2 font-bold min-w-0">
                <img src="/logo/weynishop-icon.png" alt="" className="w-7 h-7 shrink-0" />
                <span className="truncate">
                  WeyniShop <span className="text-xs font-normal text-slate-500">{title}</span>
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn-ghost p-2 -mr-1"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {user && (
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="font-semibold truncate">{user.name}</div>
                <div className="text-xs text-slate-500 truncate">{user.email}</div>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                    }`
                  }
                >
                  {n.icon}
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-2 border-t border-slate-200 space-y-1">
              {showStorefrontLink && (
                <a
                  href={STOREFRONT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <ExternalLink size={18} /> Go to Website
                </a>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={18} /> Logout
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ---------- Main ---------- */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 ${mobileBottom ? 'pb-24 md:pb-6' : ''}`}>
        {children}
      </main>

      {showStorefrontLink && (
        <div className="hidden md:block border-t border-slate-200 bg-white">
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

      {/* ---------- Optional bottom tab bar (short navs only) ---------- */}
      {mobileBottom && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30">
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
          >
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
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
