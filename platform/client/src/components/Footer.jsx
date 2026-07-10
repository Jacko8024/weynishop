import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const NAV = [
  {
    title: 'Shop',
    links: [
      { to: '/', label: 'Home' },
      { to: '/search', label: 'All products' },
      { to: '/deals', label: 'Flash deals' },
      { to: '/wishlist', label: 'My wishlist' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/contact', label: 'Contact' },
      { to: '/faq', label: 'Help & FAQ' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/terms', label: 'Terms' },
      { to: '/privacy', label: 'Privacy' },
    ],
  },
];

export default function Footer() {
  return (
    <>
      {/* ── About Weynishop ── */}
      <section
        className="pt-16 pb-10"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="max-w-page mx-auto px-3 md:px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Weynishop – The First Ethiopian Marketplace in Arab Countries
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Hero Section{" "}
            </h2>
            <h3 className="text-2xl md:text-3xl font-bold mb-2">
              Everything Ethiopians Need, Delivered to Your Door{"  "}{" "}
            </h3>
            <p
              className="text-lg md:text-xl font-medium mb-6"
              style={{ color: "var(--color-muted)" }}
            >
              {" "}
              Whether you're in Lebanon, Saudi Arabia, the UAE, Qatar, Kuwait,
              Oman, Bahrain, or Jordan, Weynishop makes it easy to shop from
              trusted Ethiopian businesses using only your mobile phone.{" "}
              <br></br>
              Order fresh Ethiopian meals, traditional Baltina products,
              groceries, Habesha clothing, shoes, beauty products, hair care
              items, electronics, and everyday essentials—all with convenient
              home delivery.{" "}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              About Weynishop
            </h2>
            <h3 className="text-2xl md:text-3xl font-bold mb-2">
              {" "}
              Built by Ethiopians, for Ethiopians Living in Arab Countries{" "}
            </h3>
            <p
              className="text-lg md:text-xl font-medium mb-6"
              style={{ color: "var(--color-muted)" }}
            >
              Weynishop is the first all-in-one Ethiopian online marketplace
              designed specifically for Ethiopian communities living and working
              across Arab countries. <br></br>
              Many Ethiopians—especially domestic workers and people with
              limited time to shop in person—need a reliable way to buy the
              products they use every day. Weynishop connects customers with
              trusted Ethiopian merchants and local delivery partners, making
              shopping simple, convenient, and accessible through a mobile
              phone.<br></br>
              Our platform brings together Ethiopian-owned businesses that sell
              food, groceries, traditional products, clothing, beauty products,
              electronics, and many other essentials in one trusted marketplace.{" "}
              <br></br>
              Whether you need lunch delivered to your workplace, traditional
              Ethiopian spices, new clothing, hair products, or household
              essentials, Weynishop helps you find everything in one place.
            </p>
            <h2 className="font-semibold mb-2">What You Can Order </h2>
            <h3 className="font-semibold mb-2">Ethiopian Food Delivery </h3>
            <p
              className="text-sm md:text-base leading-relaxed mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              {" "}
              Injera, Doro Wat, Shiro, Kitfo, Tibs, Firfir, kikel, Vegetarian
              dishes Coffee and beverages{" "}
            </p>
            <h3 className="font-semibold mb-2">Baltina Products </h3>
            <p
              className="text-sm md:text-base leading-relaxed mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              Berbere, Mitmita, Shiro Powder, Teff Flour, Green Coffee Beans,
              Ethiopian Honey, Spices Traditional Baltina products{" "}
            </p>
            <h3 className="font-semibold mb-2">Fashion & Clothing </h3>
            <p
              className="text-sm md:text-base leading-relaxed mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              Women's Fashion, Men's Fashion, Children's Clothing, Shoes, Bags,
              Traditional Ethiopian Clothing{" "}
            </p>
            <h3 className="font-semibold mb-2"> Hair & Beauty </h3>
            <h3 className="font-semibold mb-2">
              Find your favorite Ethiopian and international beauty
              products.{" "}
            </h3>
            <p
              className="text-sm md:text-base leading-relaxed mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              Hair Oils, Extensions Wigs, Shampoo, Conditioner, Skin Care
              Products, Cosmetics{" "}
            </p>
            <h2 className="font-semibold mb-2">How Weynishop Works </h2>
            <h3 className="font-semibold mb-2">For Customers </h3>

            <p
              className="text-sm md:text-base leading-relaxed mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              Browse products from Ethiopian businesses.<br></br> Place your
              order using your phone. Choose home delivery.<br></br> Receive
              your order at your doorstep.{" "}
            </p>
            <h3 className="font-semibold mb-2">For Merchants </h3>

            <p
              className="text-sm md:text-base leading-relaxed mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              Create your online shop.<br></br> Upload your products. <br></br>{" "}
              Receive customer orders. Grow your business.{" "}
            </p>
            <h3 className="font-semibold mb-2">For Delivery Partners </h3>

            <p
              className="text-sm md:text-base leading-relaxed mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              {" "}
              Accept delivery requests.<br></br> Deliver products safely.{" "}
              <br> </br>
              Earn income while serving your community.{" "}
            </p>

            <h2 className="font-semibold mb-2">Our Mission </h2>
            <p
              className="text-sm md:text-base leading-relaxed mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              {" "}
              Our mission is to make shopping easier for Ethiopians living in
              Arab countries by connecting customers, merchants, and delivery
              partners through one trusted online marketplace. <br></br>
              We believe every Ethiopian should be able to access food,
              groceries, clothing, beauty products, and everyday essentials
              quickly, safely, and conveniently, no matter where they live or
              work.{" "}
            </p>
            <h2 className="font-semibold mb-2">Why Choose Weynishop? </h2>

            <p
              className="text-sm md:text-base leading-relaxed mb-4"
              style={{ color: "var(--color-muted)" }}
            >
              {" "}
              Built specifically for Ethiopians living in Arab countries <br></br> 
              Trusted Ethiopian merchants <br></br>
               Convenient mobile shopping <br></br> 
               Secure ordering process <br></br> 
               Fast local home delivery <br></br>
                Wide range of Ethiopian products <br></br>
              Support for Ethiopian-owned businesses <br>
              </br> One platform for all your
              daily needs{" "}
            </p>            
              
             
          </div>
        </div>
      </section>

      <footer
        className="mt-12 pt-10 pb-6"
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        <div className="max-w-page mx-auto px-3 md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2">
              <img
                src="/logo/weynishopping-full.png"
                alt="WeyniShopping"
                width="140"
                height="36"
                style={{ height: 36, width: "auto" }}
                loading="lazy"
                decoding="async"
              />
              <p
                className="mt-3 text-sm max-w-xs"
                style={{ color: "var(--color-muted)" }}
              >
                Ethiopia's neighbourhood marketplace. Shop from local sellers,
                pay in cash on delivery.
              </p>
              <ul
                className="mt-4 space-y-2 text-sm"
                style={{ color: "var(--color-muted)" }}
              >
                <li className="flex items-center gap-2">
                  <Mail size={14} />{" "}
                  <a
                    className="hover:underline"
                    href="mailto:hello@weynishopping.com"
                  >
                    hello@weynishopping.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} />{" "}
                  <a className="hover:underline" href="tel:+251911000000">
                    +251 911 000 000
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} /> Addis Ababa, Ethiopia
                </li>
              </ul>
            </div>

            {NAV.map((col) => (
              <div key={col.title}>
                <h4 className="font-bold mb-3 text-sm">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        className="text-sm hover:text-brand-700"
                        style={{ color: "var(--color-muted)" }}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="flex flex-col md:flex-row items-center justify-between gap-4 pt-5 text-xs"
            style={{
              color: "var(--color-muted)",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <div>
              © {new Date().getFullYear()} WeyniShopping. All rights reserved. ·
              Made in Ethiopia 🇪🇹
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-brand-700"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-brand-700"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="hover:text-brand-700"
              >
                <Twitter size={18} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
