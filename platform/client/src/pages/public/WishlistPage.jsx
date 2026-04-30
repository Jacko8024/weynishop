import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import { useWishlist } from '../../store/wishlist.js';
import { useLoginGate } from '../../store/loginGate.js';
import { fmtPrice } from '../../lib/format.js';

export default function WishlistPage() {
  const { t } = useTranslation();
  const { user, addToCart } = useAuth();
  const reload = useWishlist((s) => s.load);
  const toggle = useWishlist((s) => s.toggle);
  const openGate = useLoginGate((s) => s.open);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); openGate(); return; }
    let on = true;
    (async () => {
      try {
        const { data } = await api.get('/wishlist');
        if (on) setItems(data.items || []);
      } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [user, openGate]);

  const remove = async (id) => {
    await toggle(id);
    setItems((arr) => arr.filter((p) => String(p._id) !== String(id)));
    reload();
  };

  const moveToCart = (p) => {
    if (p.stock === 0) return toast.error(t('product.outOfStock'));
    addToCart(p, 1);
    remove(p._id);
    toast.success('Moved to cart');
  };

  if (!user) {
    return (
      <div className="max-w-page mx-auto px-4 py-12 text-center">
        <Heart size={48} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
        <p style={{ color: 'var(--color-muted)' }}>{t('auth.loginPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-6">
      <h1 className="text-2xl font-extrabold mb-4 font-localized">{t('nav.wishlist')}</h1>

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--color-muted)' }}>{t('common.loading')}</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <Heart size={48} className="mx-auto mb-3" style={{ color: 'var(--color-muted)' }} />
          <div className="text-lg font-semibold">{t('empty.emptyWishlist')}</div>
          <Link to="/" className="btn-primary mt-4 inline-flex">{t('empty.startShopping')}</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p._id} className="card p-3 flex gap-3 items-center">
              <Link to={`/product/${p._id}`} className="w-20 h-20 rounded-lg overflow-hidden shrink-0"
                    style={{ background: 'var(--color-bg)' }}>
                {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${p._id}`} className="font-medium line-clamp-2 hover:underline">{p.name}</Link>
                <div className="price-num font-bold mt-1" style={{ color: 'var(--color-brand)' }}>
                  {fmtPrice(p.flashSaleActive ? p.flashSalePrice : p.price)} ETB
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => moveToCart(p)} disabled={p.stock === 0}
                        className="btn-primary text-sm py-1.5 px-3">
                  <ShoppingCart size={14} /> {t('product.addToCart')}
                </button>
                <button onClick={() => remove(p._id)} className="btn-ghost text-sm py-1.5 px-3 text-danger-600">
                  <Trash2 size={14} /> {t('cart.remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
