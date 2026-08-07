import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import useDocumentTitle from '../../lib/useDocumentTitle.js';

const FAQ_GROUPS = [
  {
    title: 'Weynishop Services (የወይኒገበያ አገልግሎቶች)',
    items: [
      { q: 'ከሼን (Shein) እቃ እንዴት ማዘዝ እችላለሁ?', a: 'መግዛት የሚፈልጉትን የShein እቃ መርጠው ያሳዩን፤ የዋጋውን 30% ቅድመ ክፍያ (Advance Payment) በመክፈል ትዕዛዝዎን ማረጋገጥ ይችላሉ። እቃው ሲደርስዎ ቀሪውን ይከፍላሉ።' },
      { q: 'How to pre-order from Shein?', a: 'Choose your items from Shein, send them to us, and pay a 30% down payment to confirm. You pay the remaining amount upon delivery.' },
      { q: 'ነጋዴዎች እንዴት ነው እቃቸውን እዚህ ዌብሳይት ላይ የሚሸጡት?', a: 'ዌብሳይቱ ላይ በመግባት "Register as Seller" የሚለውን በመጫን አካውንት ይከፍታሉ፤ በመቀጠል የእቃዎቻቸውን ፎቶ፣ መግለጫና ዋጋ በማስገባት በቀጥታ መሸጥ ይጀምራሉ።' },
      { q: 'How can merchants sell on Weynishop?', a: 'Simply click "Register as Seller", set up your account, upload your product photos along with prices and descriptions, and start selling instantly.' },
      { q: 'ዴሊቨሪዎች እንዴት መመዝገብ ይችላሉ?', a: '"Become a Driver" የሚለውን ገጽ በመጫን ስምዎን፣ ስልክዎን እና የመኪና/ሞተርሳይክል መረጃዎን ሞልተው ሲጨርሱ ቡድናችን አነጋግሮዎት ስራ መጀመር ይችላሉ።' },
      { q: 'How can drivers register to deliver?', a: 'Go to our "Become a Driver" page, fill in your personal and vehicle details, and our team will contact you to activate your account.' },
    ],
  },
  {
    title: 'Orders',
    items: [
      { q: 'How do I place an order?', a: 'Browse products, add them to your cart, then go to checkout. Pick a delivery address (or tap "Use my current location"), confirm your order, and a rider will bring it to your door. You only pay when it arrives.' },
      { q: 'Can I cancel my order?', a: 'Yes — you can cancel from "My orders" any time before a rider has been dispatched. Once a rider has picked up the package, contact support to cancel.' },
      { q: 'How do I track my order?', a: 'Open "My orders" from your account menu. Each order shows its current stage and a live map once a rider is assigned.' },
    ],
  },
  {
    title: 'Payments',
    items: [
      { q: 'How do I pay?', a: 'WeyniShopping is cash-on-delivery. Pay the rider in cash when your order arrives. We do not accept cards or online wallets.' },
      { q: 'Do I need to pay anything upfront?', a: 'No. You pay nothing until the package is in your hands.' },
      { q: 'What currency are prices in?', a: 'All prices are in US Dollars (USD).' },
    ],
  },
  {
    title: 'Delivery',
    items: [
      { q: 'How long does delivery take?', a: 'Most orders inside Addis Ababa arrive same-day or next-day. Outside the capital, allow 2–4 business days depending on the route.' },
      { q: 'How much is shipping?', a: 'Shipping is calculated at checkout based on distance and order weight. Many sellers offer free local delivery on orders above a minimum amount.' },
      { q: 'Do you deliver outside Addis Ababa?', a: 'Yes, we deliver nationwide through partner couriers. Tracking is provided once your rider is assigned.' },
    ],
  },
  {
    title: 'Returns',
    items: [
      { q: 'Can I return an item?', a: 'Yes — most items can be returned within 7 days of delivery if unused and in original packaging. Some categories (perishables, intimate items) are final sale.' },
      { q: 'How do I start a return?', a: 'Open the order in "My orders" and tap "Open dispute" with photos and a reason. Our team will respond within 48 hours.' },
      { q: 'When will I get my refund?', a: 'Once the return is approved and the seller confirms receipt, refunds are paid in cash through the rider on your next delivery, or by mobile money where available.' },
    ],
  },
];

export default function FAQPage() {
  useDocumentTitle(
    'FAQ',
    'Frequently asked questions about ordering, payments, delivery and returns on WeyniShopping.'
  );

  return (
    <div className="max-w-3xl mx-auto px-3 md:px-4 py-8 md:py-12">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 font-localized">Help &amp; FAQ</h1>
        <p className="text-base" style={{ color: 'var(--color-muted)' }}>
          Everything you need to know about shopping on WeyniShopping.
        </p>
      </header>

      <div className="space-y-8">
        {FAQ_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-lg font-bold mb-3">{group.title}</h2>
            <div className="card divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {group.items.map((it) => (
                <FAQRow key={it.q} q={it.q} a={it.a} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FAQRow({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left hover:bg-slate-50 transition"
        aria-expanded={open}
      >
        <span className="font-medium text-sm md:text-base">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-muted)' }}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm" style={{ color: 'var(--color-muted)' }}>
          {a}
        </div>
      )}
    </div>
  );
}
