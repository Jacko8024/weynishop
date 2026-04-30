import useDocumentTitle from '../../lib/useDocumentTitle.js';

export default function TermsPage() {
  useDocumentTitle(
    'Terms & Conditions',
    'WeyniShop Terms and Conditions — rules and guidelines for using our cash-on-delivery marketplace.'
  );

  return (
    <article className="max-w-3xl mx-auto px-3 md:px-4 py-8 md:py-12 prose-custom">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 font-localized">Terms &amp; Conditions</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Last updated: {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
      </header>

      <Section title="1. Acceptance of Terms">
        By accessing or using WeyniShop ("the Platform"), you agree to be bound by these Terms.
        If you do not agree, please do not use the Platform.
      </Section>

      <Section title="2. Eligibility">
        You must be at least 18 years old (or the age of majority in your jurisdiction) to register
        as a buyer, seller, or rider. By registering, you represent that the information you
        provide is accurate.
      </Section>

      <Section title="3. Account Responsibility">
        You are responsible for keeping your password confidential and for all activity on your
        account. Notify us immediately of any unauthorised use.
      </Section>

      <Section title="4. Marketplace Role">
        WeyniShop is a marketplace connecting independent sellers, buyers and delivery riders.
        We are not the seller of items listed by third-party sellers; sellers are solely responsible
        for the products they list, including descriptions, pricing, and legal compliance.
      </Section>

      <Section title="5. Cash-on-Delivery">
        Payment is made in cash to the assigned rider upon delivery. Refusal to pay on delivery
        without valid reason may result in account suspension and recovery of incurred costs.
      </Section>

      <Section title="6. Returns and Disputes">
        Returns are accepted within 7 days of delivery for unused, undamaged items, except for
        categories marked as final sale. Disputes are handled through our in-app dispute system
        and will be resolved within a reasonable time.
      </Section>

      <Section title="7. Prohibited Items">
        Sellers may not list illegal goods, counterfeit products, weapons, regulated substances,
        or any items that violate Ethiopian law. Listings in violation will be removed and accounts
        may be permanently banned.
      </Section>

      <Section title="8. Listing Fees and Commissions">
        Sellers may be charged a listing fee or commission as configured by the Platform.
        Current rates are visible in the seller dashboard before publishing.
      </Section>

      <Section title="9. Limitation of Liability">
        WeyniShop is not liable for indirect or consequential damages arising from use of the
        Platform. Our total liability for any claim is limited to the value of the relevant order.
      </Section>

      <Section title="10. Changes to Terms">
        We may update these Terms from time to time. Material changes will be communicated via
        in-app notice or email. Continued use of the Platform constitutes acceptance.
      </Section>

      <Section title="11. Contact">
        Questions about these Terms can be sent to{' '}
        <a className="text-brand-700 underline" href="mailto:hello@weynishop.com">hello@weynishop.com</a>.
      </Section>
    </article>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-7">
      <h2 className="text-lg md:text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--color-muted)' }}>
        {children}
      </p>
    </section>
  );
}
