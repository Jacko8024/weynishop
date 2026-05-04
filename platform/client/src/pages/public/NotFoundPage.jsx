import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';
import useDocumentTitle from '../../lib/useDocumentTitle.js';

export default function NotFoundPage() {
  useDocumentTitle('Page not found', 'The page you were looking for does not exist on WeyniShop.');

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-md">
        <div className="text-7xl md:text-9xl font-black mb-3 leading-none"
             style={{ color: 'var(--color-brand)' }}>
          404
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Page not found</h1>
        <p className="text-sm md:text-base mb-6" style={{ color: 'var(--color-muted)' }}>
          The page you're looking for doesn't exist or has moved. Try searching for what you
          need, or head back to the homepage.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link to="/" className="btn-primary">
            <Home size={16} /> Back to home
          </Link>
          <Link to="/search" className="btn-secondary">
            <Search size={16} /> Browse products
          </Link>
        </div>
      </div>
    </div>
  );
}
