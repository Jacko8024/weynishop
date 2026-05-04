import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Users, Package, Star as StarIcon } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import { useLoginGate } from '../../store/loginGate.js';
import ProductGrid from '../../components/ProductGrid.jsx';
import Stars from '../../components/Stars.jsx';
import { fmtCompact } from '../../lib/format.js';

export default function StorePage() {
  const { t } = useTranslation();
  const { sellerId } = useParams();
  const { user } = useAuth();
  const openGate = useLoginGate((s) => s.open);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let on = true;
    setLoading(true);
    (async () => {
      try {
        const { data: store } = await api.get(`/store/${sellerId}`);
        if (!on) return;
        setData(store);
        if (user) {
          try {
            const { data: f } = await api.get(`/store/${sellerId}/following`);
            if (on) setFollowing(!!f.following);
          } catch {/* ignore */}
        }
      } catch (e) {
        toast.error(e.response?.data?.message || 'Could not load store');
      } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [sellerId, user]);

  const toggleFollow = async () => {
    if (!user) return openGate();
    try {
      if (following) {
        await api.delete(`/store/${sellerId}/follow`);
        setFollowing(false);
      } else {
        await api.post(`/store/${sellerId}/follow`);
        setFollowing(true);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="max-w-page mx-auto p-6 text-center" style={{ color: 'var(--color-muted)' }}>{t('common.loading')}</div>;
  if (!data) return <div className="max-w-page mx-auto p-6 text-center">Store not found</div>;

  const { seller, stats, products } = data;

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-4 md:py-6">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden h-40 md:h-56 mb-4"
           style={{ background: seller.storeBanner ? undefined : 'linear-gradient(135deg, var(--color-brand), var(--color-accent))' }}>
        {seller.storeBanner && (
          <img src={seller.storeBanner} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Seller header */}
      <div className="card p-4 md:p-5 -mt-12 md:-mt-16 mx-2 md:mx-6 relative flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shrink-0 grid place-items-center text-white text-3xl md:text-4xl font-extrabold"
             style={{ background: 'var(--color-brand)' }}>
          {seller.shopName?.[0]?.toUpperCase() || 'S'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl md:text-2xl font-extrabold font-localized truncate">{seller.shopName}</h1>
            {seller.verified && (
              <span className="badge bg-success text-white" style={{ background: 'var(--color-success)' }}>
                ✓ {t('product.verifiedSeller')}
              </span>
            )}
          </div>
          {seller.storeDescription && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>{seller.storeDescription}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
            <span className="inline-flex items-center gap-1"><Package size={14} /> {stats.products} products</span>
            <span className="inline-flex items-center gap-1"><Users size={14} /> {fmtCompact(seller.followerCount)} followers</span>
            <span className="inline-flex items-center gap-1">
              <StarIcon size={14} className="text-accent-500 fill-accent-500" />
              <Stars value={stats.ratingAvg} size={14} showNumber count={stats.ratingCount} />
            </span>
          </div>
        </div>
        <button onClick={toggleFollow}
                className={following ? 'btn-secondary' : 'btn-primary'}>
          {following ? 'Following' : '+ Follow store'}
        </button>
      </div>

      {/* Products */}
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-3">All products</h2>
        <ProductGrid products={products} loading={false}
                     empty="This store has no products yet." />
      </div>
    </div>
  );
}
