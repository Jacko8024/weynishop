import useDocumentTitle from '../../lib/useDocumentTitle.js';

export default function PrivacyPage() {
  useDocumentTitle(
    'Privacy Policy',
    'How WeyniShop collects, uses and protects your personal information.'
  );

  return (
    <article className="max-w-3xl mx-auto px-3 md:px-4 py-8 md:py-12">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 font-localized">Privacy Policy</h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          Last updated: {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
      </header>

      <Section title="1. Information We Collect">
        We collect information you provide directly — name, email, phone number, delivery address
        and payment-on-delivery confirmation — and information collected automatically (device,
        browser, IP, and approximate location while you use the Platform).
      </Section>

      <Section title="2. How We Use Your Information">
        We use your information to process orders, route deliveries, communicate with you,
        improve the Platform, prevent fraud, and comply with legal obligations.
      </Section>

      <Section title="3. Sharing of Information">
        We share your information only as needed: with the seller fulfilling your order, with
        the rider delivering it, and with service providers who help us operate (hosting,
        analytics, communications). We do not sell your personal information.
      </Section>

      <Section title="4. Location Data">
        With your permission, we use device geolocation to fill in your delivery address and to
        let riders find you. You can revoke this permission at any time in your browser or device
        settings.
      </Section>

      <Section title="5. Cookies">
        We use cookies and similar technologies to keep you signed in, remember your preferences,
        and measure traffic. You can disable non-essential cookies in your browser; some features
        may not work without essential cookies.
      </Section>

      <Section title="6. Data Retention">
        We keep order records as required for tax, accounting and dispute resolution.
        You may request deletion of your account; we will remove personal information except
        where retention is legally required.
      </Section>

      <Section title="7. Security">
        We use industry-standard safeguards (HTTPS, hashed passwords, restricted database access)
        to protect your data. No system is perfectly secure; please notify us immediately of any
        suspected compromise of your account.
      </Section>

      <Section title="8. Children">
        WeyniShop is not directed to children under 18. We do not knowingly collect data from
        children. If you believe a child has provided us information, please contact us so we
        can remove it.
      </Section>

      <Section title="9. Your Rights">
        You can access, correct, or request deletion of your personal information by contacting
        support. We will respond within a reasonable time.
      </Section>

      <Section title="10. Changes">
        We may update this Privacy Policy from time to time. We will post the latest version at
        this URL with the date of the update.
      </Section>

      <Section title="11. Contact">
        Questions about this Privacy Policy:{' '}
        <a className="text-brand-700 underline" href="mailto:privacy@weynishop.com">privacy@weynishop.com</a>.
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
