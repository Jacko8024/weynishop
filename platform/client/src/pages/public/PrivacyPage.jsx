import { Link } from 'react-router-dom';
import useDocumentTitle from '../../lib/useDocumentTitle.js';

export default function PrivacyPage() {
  useDocumentTitle(
    'Privacy Policy',
    'How WeyniShopping collects, uses and protects your personal information.'
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
        and payment-on-delivery confirmation — and information collected automatically (device identifiers,
        push notification tokens via Firebase Cloud Messaging, IP address, and approximate location while you use the Platform).
      </Section>

      <Section title="2. How We Use Your Information">
        We use your information to process orders, route deliveries, communicate order status updates via push notifications,
        improve the Platform, prevent fraud, and comply with legal obligations.
      </Section>

      <Section title="3. Sharing of Information">
        We share your information only as needed: with the seller fulfilling your order, with
        the rider delivering it, and with infrastructure providers who help us operate (hosting,
        push notification delivery, database services). We do not sell your personal information.
      </Section>

      <Section title="4. Location Data">
        With your explicit in-app permission, we use device geolocation (foreground only) to help you pick
        and confirm your delivery address and to assist delivery riders in locating your delivery destination.
        Location data is never tracked in the background. You can revoke this permission at any time in your device settings.
      </Section>

      <Section title="5. Cookies & Local Storage">
        We use cookies and device local storage to keep you signed in, remember your shopping preferences,
        and maintain your cart and wishlist.
      </Section>

      <Section title="6. Data Retention & Account Deletion">
        We keep order and transaction records as strictly required for tax, accounting, and anti-fraud compliance.
        You may delete your account and personal data at any time directly within the app (Account &gt; Settings &gt; Security &gt; Delete Account)
        or via our dedicated web deletion page:{' '}
        <Link to="/delete-account" className="text-brand-700 underline font-medium">Request Account &amp; Data Deletion</Link>.
      </Section>

      <Section title="7. Security">
        We use industry-standard safeguards (HTTPS encryption in transit, hashed passwords, tokenized authentication)
        to protect your data.
      </Section>

      <Section title="8. Children">
        WeyniShopping is directed to a general audience (18+). We do not knowingly collect personal data from children under 18.
      </Section>

      <Section title="9. Your Rights">
        You can access, update, or permanently delete your personal information by visiting your Account Settings or contacting our Data Protection team at{' '}
        <a className="text-brand-700 underline" href="mailto:privacy@weynishopping.com">privacy@weynishopping.com</a>.
      </Section>

      <Section title="10. Changes">
        We may update this Privacy Policy from time to time. We will post the latest version at this URL.
      </Section>

      <Section title="11. Contact">
        Questions about this Privacy Policy:{' '}
        <a className="text-brand-700 underline" href="mailto:privacy@weynishopping.com">privacy@weynishopping.com</a>.
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
