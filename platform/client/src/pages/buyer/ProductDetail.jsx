import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import { formatMoney } from '../../lib/helpers.js';

export default function ProductDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addToCart } = useAuth();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => setProduct(data.product));
  }, [id]);

  if (!product) return <div className="py-10 text-center text-slate-500">Loading…</div>;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card overflow-hidden aspect-square bg-slate-100">
        {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />}
      </div>
      <div>
        <div className="text-sm text-slate-500">{product.seller?.shopName || product.seller?.name}</div>
        <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
        <div className="text-2xl text-brand-600 font-bold mt-2">{formatMoney(product.price)}</div>
        <p className="mt-4 text-slate-600 whitespace-pre-line">{product.description}</p>
        <div className="text-sm text-slate-500 mt-2">In stock: {product.stock}</div>

        <div className="mt-6 flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            className="input w-24"
          />
          <button
            className="btn-primary"
            disabled={product.stock === 0}
            onClick={() => {
              addToCart(product, qty);
              toast.success('Added to cart');
            }}
          >
            Add to cart
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              addToCart(product, qty);
              nav('/buyer/checkout');
            }}
          >
            Buy now
          </button>
        </div>

        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          💵 <strong>Cash on delivery only.</strong> You'll pay the rider in cash when your order arrives.
        </div>
      </div>
    </div>
  );
}
