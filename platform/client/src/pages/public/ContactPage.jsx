import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';
import useDocumentTitle from '../../lib/useDocumentTitle.js';

export default function ContactPage() {
  useDocumentTitle(
    'Contact us',
    'Get in touch with WeyniShop support. We answer questions about orders, deliveries, returns and selling on our marketplace.'
  );

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      return toast.error('Please fill in your name, email and message.');
    }
    setSending(true);
    try {
      await api.post('/contact', form);
      toast.success('Thanks! We received your message and will reply soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-page mx-auto px-3 md:px-4 py-8 md:py-12">
      <header className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 font-localized">Get in touch</h1>
        <p className="text-base" style={{ color: 'var(--color-muted)' }}>
          Questions about an order, becoming a seller, or partnering with us? Drop us a message.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-6">
        <aside className="md:col-span-1 space-y-4">
          <ContactCard icon={<Mail size={18} />} label="Email" value="hello@weynishop.com" href="mailto:hello@weynishop.com" />
          <ContactCard icon={<Phone size={18} />} label="Phone" value="+251 911 000 000" href="tel:+251911000000" />
          <ContactCard icon={<MapPin size={18} />} label="Address" value="Addis Ababa, Ethiopia" />
        </aside>

        <form onSubmit={submit} className="md:col-span-2 card p-5 md:p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Your name</label>
              <input className="input" value={form.name}
                     onChange={(e) => setForm({ ...form, name: e.target.value })}
                     required maxLength={120} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email}
                     onChange={(e) => setForm({ ...form, email: e.target.value })}
                     required maxLength={160} />
            </div>
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input" value={form.subject}
                   onChange={(e) => setForm({ ...form, subject: e.target.value })}
                   maxLength={200} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input min-h-[140px] py-3" value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required maxLength={4000} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={sending}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? 'Sending…' : 'Send message'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ContactCard({ icon, label, value, href }) {
  const inner = (
    <div className="card p-4 flex items-start gap-3 hover:shadow transition">
      <div className="w-10 h-10 rounded-lg grid place-items-center text-white shrink-0"
           style={{ background: 'var(--color-brand)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>{label}</div>
        <div className="font-semibold truncate">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
