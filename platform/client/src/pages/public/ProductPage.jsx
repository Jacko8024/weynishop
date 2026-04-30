import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Heart, ShoppingCart, Truck, Minus, Plus, Store as StoreIcon,
  Send, MessageSquare,
} from 'lucide-react';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import { useWishlist } from '../../store/wishlist.js';
import { useLoginGate } from '../../store/loginGate.js';
import { fmtPrice, fmtCompact, effectivePrice } from '../../lib/format.js';
import { useCategories, findCategory } from '../../lib/categories.js';
import Stars from '../../components/Stars.jsx';
import FlashCountdown from '../../components/FlashCountdown.jsx';
import ProductCard from '../../components/ProductCard.jsx';

export default function ProductPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, addToCart } = useAuth();
  useCategories(); // ensure category cache is warm so findCategory returns emoji
  const wished = useWishlist((s) => s.ids.has(String(id)));
  const toggleWish = useWishlist((s) => s.toggle);
  const openGate = useLoginGate((s) => s.open);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [breakdown, setBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });

  // Q&A
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');

  useEffect(() => {
    let on = true;
    setLoading(true);
    (async () => {
      try {
        const [p, rel, rv, qs] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/related`),
          api.get(`/reviews/product/${id}`),
          api.get(`/questions/product/${id}`),
        ]);
        if (!on) return;
        setProduct(p.data.product);
        setRelated(rel.data.items || []);
        setReviews(rv.data.reviews || []);
        setBreakdown(rv.data.breakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        setQuestions(qs.data.items || []);
        setImgIdx(0);
        setQty(1);
      } catch (e) {
        toast.error(e.response?.data?.message || 'Product not found');
      } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, [id]);

  const price = useMemo(() => product ? effectivePrice(product, qty) : 0, [product, qty]);
  const totalReviews = reviews.length;

  const onAddToCart = () => {
    if (!user) return openGate();
    if (product.stock === 0) return toast.error(t('product.outOfStock'));
    addToCart(product, qty);
    toast.success(t('product.addToCart') + ' ✓');
  };
  const onBuyNow = () => {
    if (!user) return openGate();
    if (product.stock === 0) return toast.error(t('product.outOfStock'));
    addToCart(product, qty);
    nav('/buyer/checkout');
  };
  const onWish = () => {
    if (!user) return openGate();
    toggleWish(product._id).catch(() => toast.error('Failed'));
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return openGate();
    try {
      await api.post(`/reviews/product/${id}`, reviewForm);
      const { data } = await api.get(`/reviews/product/${id}`);
      setReviews(data.reviews);
      setBreakdown(data.breakdown);
      setReviewForm({ rating: 5, text: '' });
      toast.success('Review posted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not post review');
    }
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    if (!user) return openGate();
    if (!questionText.trim()) return;
    try {
      await api.post(`/questions/product/${id}`, { text: questionText });
      const { data } = await api.get(`/questions/product/${id}`);
      setQuestions(data.items);
      setQuestionText('');
      toast.success('Question posted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="max-w-page mx-auto p-12 text-center" style={{ color: 'var(--color-muted)' }}>{t('common.loading')}</div>;
  if (!product) return <div className="max-w-page mx-auto p-12 text-center">Product not found</div>;

  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const isFlash = !!product.flashSaleActive;
  const percent = product.flashSalePercent ? Math.round(Number(product.flashSalePercent)) : null;

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-4 md:py-6">
      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        {/* Gallery */}
        <div>
          <div className="card overflow-hidden aspect-square relative" style={{ background: 'var(--color-bg)' }}>
            {images[imgIdx] ? (
              <img src={images[imgIdx]} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full grid place-items-center text-6xl">📦</div>
            )}
            {isFlash && <span className="flash-ribbon">{t('product.flashSale')}</span>}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {images.map((src, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                        className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition
                                    ${i === imgIdx ? 'border-brand-500' : 'border-transparent'}`}
                        style={{ background: 'var(--color-bg)' }}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-localized">
              <span className="mr-1.5" aria-hidden="true">{findCategory(product.category).icon}</span>
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <Stars value={product.ratingAvg} showNumber count={product.ratingCount} />
              {product.soldCount > 0 && (
                <span style={{ color: 'var(--color-muted)' }}>
                  {fmtCompact(product.soldCount)} {t('product.sold')}
                </span>
              )}
            </div>
          </div>

          {/* Price block */}
          <div className="card p-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="price-num text-3xl font-extrabold" style={{ color: isFlash ? 'var(--color-flash)' : 'var(--color-brand)' }}>
                {fmtPrice(price)} ETB
              </span>
              {(isFlash || qty > 1) && Number(price) !== Number(product.price) && (
                <span className="price-num text-base line-through" style={{ color: 'var(--color-muted)' }}>
                  {fmtPrice(product.price)}
                </span>
              )}
              {isFlash && percent && (
                <span className="badge bg-flash text-white">-{percent}%</span>
              )}
            </div>
            {isFlash && product.flashSaleEnd && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm font-semibold text-flash">{t('flashSale.endsIn')}</span>
                <FlashCountdown endAt={product.flashSaleEnd} />
              </div>
            )}

            {/* Bulk price tiers — guard against malformed payloads */}
            {(() => {
              const validTiers = (Array.isArray(product.bulkPriceTiers) ? product.bulkPriceTiers : [])
                .filter((t) => t && typeof t === 'object' && Number(t.minQty) > 0 && Number(t.price) > 0)
                .map((t) => ({ minQty: Number(t.minQty), price: Number(t.price) }));
              if (validTiers.length === 0) return null;
              const rows = [{ minQty: 1, price: Number(product.price) }, ...validTiers];
              return (
                <div className="mt-4">
                  <div className="text-sm font-semibold mb-2">{t('product.bulkPrice')}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {rows.map((tier, i) => (
                      <div key={i} className="rounded-lg border p-2 text-center"
                           style={{ borderColor: 'var(--color-border)' }}>
                        <div className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                          {tier.minQty}+ pcs
                        </div>
                        <div className="price-num font-semibold text-sm">{fmtPrice(tier.price)} ETB</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quantity + actions */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{t('product.qty')}</span>
              <div className="inline-flex items-center rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                <button className="px-2.5 py-1.5 hover:bg-[var(--color-bg)]" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus size={14} />
                </button>
                <input type="number" value={qty} min={1} max={product.stock || 1}
                       onChange={(e) => setQty(Math.max(1, Math.min(product.stock || 1, Number(e.target.value) || 1)))}
                       className="w-12 text-center bg-transparent outline-none price-num" />
                <button className="px-2.5 py-1.5 hover:bg-[var(--color-bg)]" onClick={() => setQty((q) => Math.min(product.stock || q + 1, q + 1))}>
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {product.stock > 0 ? `${product.stock} ${t('product.inStock')}` : t('product.outOfStock')}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={onBuyNow} disabled={product.stock === 0}
                      className="btn-accent flex-1 min-w-[140px]">
                {t('product.buyNow')}
              </button>
              <button onClick={onAddToCart} disabled={product.stock === 0}
                      className="btn-primary flex-1 min-w-[140px]">
                <ShoppingCart size={16} /> {t('product.addToCart')}
              </button>
              <button onClick={onWish}
                      className="btn-secondary"
                      aria-label="Wishlist">
                <Heart size={18} className={wished ? 'fill-flash text-flash' : ''} />
              </button>
            </div>

            {product.freeShipping && (
              <div className="text-sm inline-flex items-center gap-1.5"
                   style={{ color: 'var(--color-success)' }}>
                <Truck size={14} /> {t('product.freeShipping')}
              </div>
            )}
          </div>

          {/* Seller card */}
          {product.seller && (
            <Link to={`/store/${product.seller._id || product.seller.id}`}
                  className="card p-3 flex items-center gap-3 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl grid place-items-center text-white font-bold"
                   style={{ background: 'var(--color-brand)' }}>
                {(product.seller.shopName || product.seller.name)?.[0]?.toUpperCase() || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate flex items-center gap-1.5">
                  {product.seller.shopName || product.seller.name}
                  {product.seller.verified && <span className="verified-tick">✓</span>}
                </div>
                <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('product.visitStore')} →</div>
              </div>
              <StoreIcon size={18} style={{ color: 'var(--color-muted)' }} />
            </Link>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <section className="card p-4 md:p-5 mt-6">
          <h2 className="font-bold text-lg mb-2">{t('product.description')}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            {product.description}
          </p>
        </section>
      )}

      {/* Reviews */}
      <section className="card p-4 md:p-5 mt-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold text-lg">{t('product.reviews')} ({totalReviews})</h2>
          <Stars value={product.ratingAvg} showNumber />
        </div>

        {/* Breakdown bars */}
        <div className="mt-3 space-y-1">
          {[5, 4, 3, 2, 1].map((r) => {
            const count = breakdown[r] || 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={r} className="flex items-center gap-2 text-xs">
                <span className="w-6">{r}★</span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                  <div className="h-full rounded-full bg-accent-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right" style={{ color: 'var(--color-muted)' }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Submit review */}
        <form onSubmit={submitReview} className="mt-5 space-y-2 border-t pt-4"
              style={{ borderColor: 'var(--color-border)' }}>
          <div className="font-semibold text-sm">{t('product.writeReview')}</div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
                      className={`text-2xl ${n <= reviewForm.rating ? 'text-accent-500' : 'text-gray-300'}`}>
                ★
              </button>
            ))}
          </div>
          <textarea value={reviewForm.text} onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
                    placeholder="Share your experience..." rows={3} className="input" />
          <button type="submit" className="btn-primary text-sm">
            <Send size={14} /> {t('product.writeReview')}
          </button>
        </form>

        {/* Review list */}
        <div className="mt-5 space-y-3">
          {reviews.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-muted)' }}>
              {t('product.noReviews')}
            </p>
          )}
          {reviews.map((r) => (
            <div key={r._id} className="border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{r.author?.name || 'Customer'}</div>
                <Stars value={r.rating} size={12} />
              </div>
              {r.text && <p className="text-sm mt-1" style={{ color: 'var(--color-text)' }}>{r.text}</p>}
              <div className="text-[11px] mt-1" style={{ color: 'var(--color-muted)' }}>
                {new Date(r.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Q&A */}
      <section className="card p-4 md:p-5 mt-6">
        <h2 className="font-bold text-lg mb-3 inline-flex items-center gap-2">
          <MessageSquare size={18} /> Q&amp;A
        </h2>
        <form onSubmit={submitQuestion} className="flex gap-2 mb-4">
          <input value={questionText} onChange={(e) => setQuestionText(e.target.value)}
                 placeholder={t('product.askQuestion')} className="input flex-1" />
          <button type="submit" className="btn-primary text-sm">
            <Send size={14} />
          </button>
        </form>
        <div className="space-y-3">
          {questions.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-muted)' }}>
              {t('product.noQuestions')}
            </p>
          )}
          {questions.map((q) => (
            <div key={q._id} className="border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
              <div className="text-sm">
                <span className="font-semibold">Q: </span>{q.text}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                {q.asker?.name || 'Customer'} · {new Date(q.createdAt).toLocaleDateString()}
              </div>
              {q.answer ? (
                <div className="mt-2 pl-3 border-l-2 text-sm" style={{ borderColor: 'var(--color-brand)' }}>
                  <span className="font-semibold">A: </span>{q.answer}
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    Seller · {q.answeredAt && new Date(q.answeredAt).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-xs italic" style={{ color: 'var(--color-muted)' }}>
                  Awaiting seller's answer...
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold text-lg mb-3">{t('product.peopleAlsoBought')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {related.slice(0, 10).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
