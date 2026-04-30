import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard.jsx';

export function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-2.5 space-y-2">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-3/4" />
        <div className="skeleton h-4 w-1/3 mt-1" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products = [], loading = false, skeletonCount = 8, empty }) {
  const { t } = useTranslation();
  if (loading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {Array.from({ length: skeletonCount }).map((_, i) => <ProductSkeleton key={i} />)}
      </div>
    );
  }
  if (!loading && products.length === 0) {
    return (
      <div className="py-16 text-center" style={{ color: 'var(--color-muted)' }}>
        {empty || t('empty.noProducts')}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}
