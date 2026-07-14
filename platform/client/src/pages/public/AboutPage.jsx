import useDocumentTitle from '../../lib/useDocumentTitle.js';

export default function AboutPage() {
  useDocumentTitle(
    'About — Weynishop | Ethiopian Marketplace in Arab Countries',
    'Weynishop is the first Ethiopian online marketplace in Arab countries. Shop Ethiopian food, Baltina products, clothing, beauty and more. Order delivery to Lebanon, UAE, Saudi Arabia, Qatar, Kuwait, Oman, Bahrain and Jordan.'
  );

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-8 md:py-12 space-y-14">
      {/* ── Hero ── */}
      <section className="text-center max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 font-localized">
          Weynishop – The First Ethiopian Marketplace in Arab Countries
        </h1>
        <p className="text-lg md:text-xl leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Whether you're in Lebanon, Saudi Arabia, the UAE, Qatar, Kuwait, Oman, Bahrain, or Jordan,
          Weynishop makes it easy to shop from trusted Ethiopian businesses using only your mobile phone.
        </p>
        <p className="text-base md:text-lg mt-4 leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Order fresh Ethiopian meals, traditional Baltina products, groceries, Habesha clothing, shoes,
          beauty products, hair care items, electronics, and everyday essentials — all with convenient home delivery.
        </p>
      </section>

      {/* ── About ── */}
      <section className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">About Weynishop</h2>
        <h3 className="text-xl md:text-2xl font-semibold mb-5">
          Built by Ethiopians, for Ethiopians Living in Arab Countries
        </h3>
        <div className="space-y-4 text-left max-w-3xl mx-auto" style={{ color: 'var(--color-muted)' }}>
          <p className="text-sm md:text-base leading-relaxed">
            Weynishop is the first all-in-one Ethiopian online marketplace designed specifically for
            Ethiopian communities living and working across Arab countries.
          </p>
          <p className="text-sm md:text-base leading-relaxed">
            Many Ethiopians — especially domestic workers and people with limited time to shop in person —
            need a reliable way to buy the products they use every day. Weynishop connects customers with
            trusted Ethiopian merchants and local delivery partners, making shopping simple, convenient,
            and accessible through a mobile phone.
          </p>
          <p className="text-sm md:text-base leading-relaxed">
            Our platform brings together Ethiopian-owned businesses that sell food, groceries, traditional
            products, clothing, beauty products, electronics, and many other essentials in one trusted marketplace.
          </p>
          <p className="text-sm md:text-base leading-relaxed">
            Whether you need lunch delivered to your workplace, traditional Ethiopian spices, new clothing,
            hair products, or household essentials, Weynishop helps you find everything in one place.
          </p>
        </div>
      </section>

      {/* ── What You Can Order ── */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">What You Can Order</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <CategoryCard
            title="Ethiopian Food Delivery"
            items={['Injera', 'Doro Wat', 'Shiro', 'Kitfo', 'Tibs', 'Firfir', 'Kikel', 'Vegetarian dishes', 'Coffee and beverages']}
          />
          <CategoryCard
            title="Baltina Products"
            items={['Berbere', 'Mitmita', 'Shiro Powder', 'Teff Flour', 'Green Coffee Beans', 'Ethiopian Honey', 'Spices', 'Traditional Baltina products']}
          />
          <CategoryCard
            title="Fashion & Clothing"
            items={["Women's Fashion", "Men's Fashion", "Children's Clothing", 'Shoes', 'Bags', 'Traditional Ethiopian Clothing']}
          />
          <CategoryCard
            title="Hair & Beauty"
            items={['Hair Oils', 'Extensions & Wigs', 'Shampoo & Conditioner', 'Skin Care Products', 'Cosmetics']}
          />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">How Weynishop Works</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          <RoleCard
            role="For Customers"
            steps={['Browse products from Ethiopian businesses', 'Place your order using your phone', 'Choose home delivery', 'Receive your order at your doorstep']}
          />
          <RoleCard
            role="For Merchants"
            steps={['Create your online shop', 'Upload your products', 'Receive customer orders', 'Grow your business']}
          />
          <RoleCard
            role="For Delivery Partners"
            steps={['Accept delivery requests', 'Deliver products safely', 'Earn income while serving your community']}
          />
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Mission</h2>
        <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--color-muted)' }}>
          Our mission is to make shopping easier for Ethiopians living in Arab countries by connecting
          customers, merchants, and delivery partners through one trusted online marketplace.
        </p>
        <p className="text-sm md:text-base leading-relaxed mt-3" style={{ color: 'var(--color-muted)' }}>
          We believe every Ethiopian should be able to access food, groceries, clothing, beauty products,
          and everyday essentials quickly, safely, and conveniently, no matter where they live or work.
        </p>
      </section>

      {/* ── Why Choose ── */}
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-5 text-center">Why Choose Weynishop?</h2>
        <ul className="grid sm:grid-cols-2 gap-3 text-sm md:text-base" style={{ color: 'var(--color-muted)' }}>
          {[
            'Built specifically for Ethiopians living in Arab countries',
            'Trusted Ethiopian merchants',
            'Convenient mobile shopping',
            'Secure ordering process',
            'Fast local home delivery',
            'Wide range of Ethiopian products',
            'Support for Ethiopian-owned businesses',
            'One platform for all your daily needs',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-brand)' }} />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CategoryCard({ title, items }) {
  return (
    <div className="card p-5">
      <h3 className="font-bold mb-2 text-lg">{title}</h3>
      <ul className="space-y-1 text-sm" style={{ color: 'var(--color-muted)' }}>
        {items.map((item) => (
          <li key={item} className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: 'var(--color-brand)' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleCard({ role, steps }) {
  return (
    <div className="card p-5">
      <h3 className="font-bold mb-3 text-lg">{role}</h3>
      <ol className="space-y-2 text-sm" style={{ color: 'var(--color-muted)' }}>
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full grid place-items-center text-xs font-bold text-white shrink-0 mt-0.5"
                  style={{ background: 'var(--color-brand)' }}>
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
