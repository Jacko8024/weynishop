import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Star, PlayCircle, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import useDocumentTitle from '../../lib/useDocumentTitle.js';
import SurpriseBookingModal from '../../components/SurpriseBookingModal.jsx';

const PINK = '#e63956';
const PINK_DARK = '#c72645';

const WHATSAPP_NUMBER = '251952655404';

const CATEGORIES = [
  { icon: '🎂', key: 'birthday' },
  { icon: '🌹', key: 'flowers' },
  { icon: '🎈', key: 'decoration' },
  { icon: '🎁', key: 'giftbox' },
  { icon: '🍰', key: 'cake' },
  { icon: '💍', key: 'proposal' },
];

const SHARED_FEATURES = ['ከእኛ የምናዘጋጀው', 'ኬክ እና ሪችት', '🚚 ከድላይቨሪ ውጪ'];

// Gift Delivery packages (shown directly from the front-end).
const GIFT_FEATURES = ['ከእኛ የምናዘጋጀው', 'እቅፍ አበባ', 'የፍቅር መልእክት ካርድ', 'ኬክ'];

const FALLBACK_GROUPS = [
  {
    id: 'birthday',
    title: 'ለልደት እና እንዲሁ ሰርፕራይዝ ለማድረግ',
    subtitle:
      'እርሶን ወክለን, ልደት, ምርቃት, ለተለያዮ በአላት ወይንም እንዲሁ ፍቅሮትን ለመግለፅ እርሶን ወክለን ባዘዙን መንገድ እናደርስሎታለን',
    providers: [
      { name: 'Tihun Surprise Team', img: '/surprise/1.1.jpg', rating: 4.9, price: 50, features: SHARED_FEATURES },
      { name: 'Tihun Events', img: '/surprise/2.jpg', rating: 4.8, price: 50, features: SHARED_FEATURES },
      { name: 'Tihun Surprise', img: '/surprise/6.jpg', rating: 5.0, price: 50, features: SHARED_FEATURES },
    ],
  },
  {
    id: 'event',
    title: 'ለሀዘን, ለደስታ (ድግስ) ወይንም የታመመ ለመጠየቅ',
    subtitle:
      'በሀገር መራራቅ ምክንያት ለሚወዷቸው ሰዎች ድግስ, ሀዘን ወይንም ህመም ተፈጥሮ እርሶ መምጣት ባይችሉ እንኳን, እርሶ ለወዳጆ ትልቅ ቦታ እንዳሎት እያሰቧቸው እንደሆነ እኛ እርሶን ወክለን ተገኝተንሎት ማሳየት ይችላሉ',
    providers: [
      {
        name: 'Tihun Surprise Team',
        img: '/surprise/7.jpg',
        rating: 4.9,
        price: 125,
        features: ['ለ10 ሰው የሚሆን አገልግል ምግብ', '2 የታሸገ ውሀ ግማሽ ሌትር', '🚚 ከድላይቨሪ ውጪ'],
      },
      {
        name: 'Tihun Events',
        img: '/surprise/8.jpg',
        rating: 4.8,
        price: 125,
        features: ['ለ10 ሰው የሚሆን አገልግል ምግብ', '2 የታሸገ ውሀ ግማሽ ሌትር', '🚚 ከድላይቨሪ ውጪ'],
      },
      {
        name: 'Tihun Surprise',
        img: '/surprise/9.jpg',
        rating: 5.0,
        price: 125,
        features: ['ለ10 ሰው የሚሆን አገልግል ምግብ', '2 የታሸገ ውሀ ግማሽ ሌትር', '🚚 ከድላይቨሪ ውጪ'],
      },
    ],
  },
  {
    id: 'gift',
    title: 'ስጦታ ማድረስ (Gift Delivery)',
    subtitle: 'ለፍቅረኛዎ, ለቤተሰብዎ ወይም ለጓደኛዎ ስጦታ በእኛ አማካኝነት ወደ ውድ ሰዎችዎ ያድርሱ',
    providers: [
      { name: 'የአንቨርሰሪ', img: '/surprise/4.jpg', rating: 4.9, price: 50, features: GIFT_FEATURES },
      { name: 'የታገቢኛለሽ ፕሮፖዝ ማድረጊያ', img: '/surprise/5.jpg', rating: 4.8, price: 50, features: GIFT_FEATURES },
      { name: 'ሰርፕራይዝ ማድረጊያ', img: '/surprise/6.jpg', rating: 5.0, price: 50, features: GIFT_FEATURES },
    ],
  },
];

const GIFT_PACKAGES = [
  { name: 'የአንቨርሰሪ', features: GIFT_FEATURES },
  { name: 'የታገቢኛለሽ ፕሮፖዝ ማድረጊያ', features: GIFT_FEATURES },
  { name: 'ሰርፕራይዝ ማድረጊያ', features: GIFT_FEATURES },
];

// The 3 canonical Gift Delivery packages — used so the section always shows
// the right names + contents on the front-end, even when the API still
// returns the old/empty seed data.
const TIHUN_PILLARS = [
  { icon: '🎂', key: 'birthday' },
  { icon: '🤝', key: 'hardship' },
  { icon: '💍', key: 'love' },
];

function applyGiftPackages(groups, packages) {
  return groups.map((g) => {
    if (g.id !== 'gift' || !Array.isArray(packages)) return g;
    return {
      ...g,
      providers: g.providers.map((p, i) =>
        packages[i] ? { ...p, name: packages[i].name, features: packages[i].features, price: packages[i].price ?? p.price } : p
      ),
    };
  });
}

const STEP_KEYS = [
  { icon: '📋', title: 'chooseTitle', text: 'chooseText' },
  { icon: '✍️', title: 'bookTitle', text: 'bookText' },
  { icon: '🚚', title: 'deliverTitle', text: 'deliverText' },
];

const FEATURE_KEYS = {
  'ከእኛ የምናዘጋጀው': 'surprise.features.prepared',
  'ኬክ እና ሪችት': 'surprise.features.cake',
  '🚚 ከድላይቨሪ ውጪ': 'surprise.features.delivery',
  'ለ10 ሰው የሚሆን አገልግል ምግብ': 'surprise.features.food',
  '2 የታሸገ ውሀ ግማሽ ሌትር': 'surprise.features.water',
};

export default function SurprisePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useDocumentTitle(null, t('surprise.metaDesc'));

  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [sending, setSending] = useState(false);

  // Gift Delivery packages come from the translations file so they show in all
  // 5 languages; the module-level Amharic list is only a safety fallback.
  const giftPackages = (() => {
    const loc = t('surprise.giftPackages', { returnObjects: true });
    return Array.isArray(loc) && loc.length === 3 ? loc : GIFT_PACKAGES;
  })();
  const giftKey = JSON.stringify(giftPackages);

  const [groups, setGroups] = useState(() => applyGiftPackages(FALLBACK_GROUPS, giftPackages));

  useEffect(() => {
    let on = true;
    api.get('/surprise')
      .then(({ data }) => { if (on && data.groups?.length) setGroups(applyGiftPackages(data.groups, giftPackages)); })
      .catch(() => {});
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setGroups((prev) => applyGiftPackages(prev, giftPackages));
  }, [giftKey]);

  // Placing an order requires an account — exactly like buying in the shop.
  const openBooking = (provider, serviceType) => {
    if (!user) {
      toast(t('surprise.form.loginRequired'), { icon: '🔐' });
      navigate('/login?redirect=/surprise');
      return;
    }
    setBooking({
      serviceType: serviceType || 'birthday',
      provider: provider?.name || '',
      serviceId: provider?.id != null ? provider.id : provider?._id || null,
      price: provider?.price != null ? provider.price : null,
      img: provider?.image || provider?.img || null,
      features: Array.isArray(provider?.features) ? provider.features : [],
    });
  };

  const submit = async (data) => {
    setSending(true);
    try {
      const extras = {
        toWhom: data.toWhom || '',
        occasion: data.occasion || '',
        people: data.people || '',
        address: data.address || '',
        ideas: data.ideas || [],
        message: data.message || '',
        package: data.package || '',
      };
      const price = data.budget && Number(data.budget) > 0 ? Number(data.budget) : booking?.price;
      await api.post('/surprise', {
        name: data.fullName,
        phone: data.phone,
        email: data.email,
        city: data.city,
        serviceType: data.serviceType,
        serviceId: booking?.serviceId ?? null,
        provider: booking?.provider,
        price: price ?? null,
        surpriseDate: data.surpriseDate,
        notes: data.notes,
        userId: user.id,
        extras,
      });
      toast.success(t('surprise.form.success'));
      setBooking(null);
    } catch (err) {
      toast.error(err.response?.data?.message || t('surprise.fail'));
    } finally {
      setSending(false);
    }
  };

  const translateFeature = (f) => (FEATURE_KEYS[f] ? t(FEATURE_KEYS[f]) : f);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t('surprise.whatsappText'))}`;

  return (
    <div style={{ background: '#fff8f8', color: '#333' }} className="min-h-screen">
      {/* ── TIHUN EVENT BRAND HEADER ── */}
      <header className="text-white relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #ff9db8 0%, #e63956 55%, #a3162f 100%)' }}>
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-24 -right-10 w-80 h-80 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-6 right-1/4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
        <div className="relative max-w-[1200px] mx-auto px-5 py-12 md:py-16 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <img
              src="/surprise/tihun-event-logo.jpg"
              alt="Tihun Event"
              className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover ring-4 ring-white/80 shadow-[0_18px_45px_rgba(0,0,0,.3)]"
            />
            <span className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white grid place-items-center shadow-md">
              <span className="text-lg">🎉</span>
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,.25)]">
            Tihun <span style={{ color: '#ffe3eb' }}>Event</span>
          </h1>
          <p className="mt-4 max-w-2xl text-white/95 text-base md:text-lg leading-relaxed">
            {t('surprise.tihunSub')}
          </p>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12 items-center px-5 py-14 md:py-[70px]">
        <div>
          <h1 className="text-4xl md:text-[58px] font-extrabold leading-[1.1] mb-5">
            {t('surprise.heroTitle1')} <span style={{ color: PINK }}>{t('surprise.heroTitle2')}</span> {t('surprise.heroTitle3')}
          </h1>
          <p className="text-[#666] text-base md:text-lg leading-[1.7] mb-8">
            {t('surprise.heroSub')}
          </p>
          <div className="flex flex-col sm:flex-row gap-5 mb-10">
            <a href="#providers" className="inline-flex items-center justify-center px-7 py-3.5 rounded-lg font-semibold text-white transition"
               style={{ background: PINK }} onMouseEnter={(e) => (e.currentTarget.style.background = PINK_DARK)} onMouseLeave={(e) => (e.currentTarget.style.background = PINK)}>
              {t('surprise.bookNow')}
            </a>
            <a href="#how" className="inline-flex items-center justify-center gap-2.5 font-semibold text-[#333]">
              <PlayCircle size={22} style={{ color: PINK }} /> {t('surprise.howItWorks')}
            </a>
          </div>
          <div className="flex flex-wrap gap-8 text-[#666]">
            <span><MapPin size={16} style={{ color: PINK }} className="inline mr-2" />Beirut</span>
            <span><Clock size={16} style={{ color: PINK }} className="inline mr-2" />{t('surprise.sameDay')}</span>
            <span><Star size={16} style={{ color: PINK }} className="inline mr-2" />{t('surprise.trustedProviders')}</span>
          </div>
        </div>
        <div>
          <img src="/surprise/1.jpg" alt="Surprise Delivery" className="w-full rounded-[30px] shadow-[0_20px_45px_rgba(0,0,0,.12)]" />
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="max-w-[1200px] mx-auto px-5 py-14">
        <h2 className="text-center text-2xl md:text-4xl font-bold mb-11">{t('surprise.categoriesTitle')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => document.getElementById('providers')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white rounded-2xl text-center py-8 px-4 shadow-[0_8px_25px_rgba(0,0,0,.05)] transition hover:-translate-y-2 cursor-pointer">
              <span className="block text-4xl">{c.icon}</span>
              <h3 className="mt-4 text-[18px]">{t(`surprise.categories.${c.key}`)}</h3>
            </button>
          ))}
        </div>
      </section>

      {/* ── PROVIDERS ── */}
      {groups.map((group, gi) => (
        <section key={group.id} id={gi === 0 ? 'providers' : undefined} className="max-w-[1200px] mx-auto px-5 py-14">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-2.5">
              {t(`surprise.groupTitle.${group.id}`, { defaultValue: group.title })}
            </h2>
            <p className="text-[#666] max-w-3xl mx-auto leading-relaxed">
              {t(`surprise.groupSubtitle.${group.id}`, { defaultValue: group.subtitle })}
            </p>
            {group.id === 'gift' && (() => {
              const intro = t('surprise.giftIntro');
              return intro && intro.trim() ? (
                <p className="text-[#666] max-w-3xl mx-auto leading-[1.9] mt-5 whitespace-pre-line">
                  {intro}
                </p>
              ) : null;
            })()}
          </div>
          <div className="grid md:grid-cols-3 gap-7">
            {group.providers.map((p) => (
              <div key={(p._id || p.id) + group.id} className="bg-white rounded-[20px] overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,.06)] transition hover:-translate-y-2.5">
                <img src={p.image || p.img} alt={p.name} className="w-full h-60 object-cover" />
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2.5">{p.name}</h3>
                  <p className="mb-4 text-[#333]">⭐⭐⭐⭐⭐ {Number(p.rating || 0).toFixed(1)}</p>
                  {p.provider?.name && (
                    <p className="text-xs mb-3" style={{ color: '#888' }}>
                      {t('surprise.postedBy', { name: p.provider.shopName || p.provider.name })}
                    </p>
                  )}
                  <ul className="list-none text-[#666] leading-8 mb-1">
                    {(p.features || []).map((f, fi) => (
                      <li key={fi}>✔ {translateFeature(f)}</li>
                    ))}
                  </ul>
                  <div className="my-5 text-lg">
                    {t('surprise.startingFrom')} <strong style={{ color: PINK }}>${p.price}</strong>
                  </div>
                  <button onClick={() => openBooking(p, group.id)}
                          className="w-full text-center text-white font-semibold py-3.5 rounded-[10px] transition"
                          style={{ background: PINK }} onMouseEnter={(e) => (e.currentTarget.style.background = PINK_DARK)} onMouseLeave={(e) => (e.currentTarget.style.background = PINK)}>
                    {t('surprise.bookNow')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="max-w-[1200px] mx-auto px-5 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-bold">{t('surprise.howItWorks')}</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {STEP_KEYS.map((s, i) => (
            <div key={s.title} className="bg-white rounded-2xl p-8 text-center shadow-[0_8px_25px_rgba(0,0,0,.05)]">
              <div className="w-16 h-16 mx-auto grid place-items-center rounded-full text-3xl mb-4" style={{ background: '#ffe8ee' }}>
                {s.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{i + 1}. {t(`surprise.steps.${s.title}`)}</h3>
              <p className="text-[#666] text-sm leading-relaxed">{t(`surprise.steps.${s.text}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIHUN EVENT ── */}
      <section className="max-w-[1200px] mx-auto px-5 pb-16">
        <div className="bg-white rounded-[30px] p-8 md:p-12 text-center shadow-[0_12px_35px_rgba(0,0,0,.06)]">
          <img
            src="/surprise/tihun-event-logo.jpg"
            alt="Tihun Event"
            className="mx-auto w-24 h-24 md:w-28 md:h-28 rounded-full object-cover shadow-[0_10px_30px_rgba(0,0,0,.15)] mb-5"
          />
          <h2 className="text-2xl md:text-4xl font-extrabold mb-3">Tihun Event</h2>
          <p className="max-w-2xl mx-auto text-[#666] leading-relaxed">{t('surprise.tihunSub')}</p>
          <div className="grid sm:grid-cols-2 gap-5 mt-8">
            <img
              src="/surprise/tihun-event-1.jpg"
              alt="Tihun Event"
              className="w-full h-56 md:h-72 object-cover rounded-[20px] shadow-[0_12px_35px_rgba(0,0,0,.12)]"
            />
            <img
              src="/surprise/tihun-event-2.jpg"
              alt="Tihun Event"
              className="w-full h-56 md:h-72 object-cover rounded-[20px] shadow-[0_12px_35px_rgba(0,0,0,.12)]"
            />
          </div>

          <div className="mt-12 pt-10 border-t border-[#ffe8ee] space-y-6">
            <p className="text-lg md:text-2xl font-bold leading-snug">{t('surprise.tihun.quote')}</p>
            <p className="max-w-3xl mx-auto text-[#666] leading-relaxed">{t('surprise.tihun.intro')}</p>
            <p className="max-w-3xl mx-auto text-[#666] leading-relaxed">
              {t('surprise.tihun.story', { brand: t('brand.name') })}
            </p>

            <div className="pt-2">
              <h3 className="text-xl md:text-2xl font-bold mb-6">{t('surprise.tihun.pillTitle')}</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {TIHUN_PILLARS.map((p) => (
                  <div key={p.key} className="bg-[#fff8f8] rounded-2xl p-5">
                    <span className="block text-3xl mb-2">{p.icon}</span>
                    <h4 className="font-bold mb-1.5">{t(`surprise.tihun.pillars.${p.key}.title`)}</h4>
                    <p className="text-sm text-[#666] leading-relaxed">{t(`surprise.tihun.pillars.${p.key}.text`)}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-lg md:text-xl font-bold leading-relaxed pt-2">{t('surprise.tihun.promise')}</p>
            <p className="max-w-3xl mx-auto text-[#666] leading-relaxed">{t('surprise.tihun.final')}</p>
          </div>
        </div>
      </section>

      {/* ── BOOKING MODAL (account required) ── */}
      {booking && (
        <SurpriseBookingModal
          booking={booking}
          user={user}
          sending={sending}
          onSubmit={submit}
          onClose={() => setBooking(false)}
        />
      )}

      {/* ── WHATSAPP ── */}
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
         className="fixed right-6 bottom-6 w-[60px] h-[60px] rounded-full bg-[#25d366] text-white grid place-items-center shadow-[0_10px_25px_rgba(0,0,0,.2)] transition hover:scale-110 z-40"
         aria-label="WhatsApp">
        <MessageCircle size={30} className="fill-white" />
      </a>
    </div>
  );
}
