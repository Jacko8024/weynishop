import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import { api } from '../../api/client.js';
import ProductGrid from '../../components/ProductGrid.jsx';

export default function DealsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const { data } = await api.get('/products/flash-deals');
        if (on) setItems(data.items || []);
      } finally { if (on) setLoading(false); }
    })();
    return () => { on = false; };
  }, []);

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl grid place-items-center text-white"
             style={{ background: 'linear-gradient(135deg,#EB5824,#C7461A)' }}>
          <Zap size={24} className="fill-white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold font-localized">{t('flashSale.title')}</h1>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Limited time, while stock lasts.</p>
        </div>
      </div>
      <ProductGrid products={items} loading={loading} />
    </div>
  );
}
