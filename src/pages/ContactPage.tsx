import { useState } from 'react';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success('Message sent! We\'ll reply within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-black text-cream mb-4">Contact Us</h1>
        <p className="text-cream/50 text-lg">We respond to all inquiries within 24 hours.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-4">
          {[
            { icon: Mail, label: 'General Support', value: 'assistance.paybridge@outlook.com' },
            { icon: Mail, label: 'Compliance', value: 'compliance.paybridge@outlook.com' },
            { icon: Mail, label: 'Applications', value: 'apply.paybridge@outlook.com' },
            { icon: MapPin, label: 'Mailing Address', value: 'PayBridge LLC\nP.O. Box 12345\nDelaware, USA' },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} padding="md">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201,168,76,0.15)' }}>
                  <Icon size={16} className="text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-cream/50 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-cream whitespace-pre-line break-all">{value}</p>
                </div>
              </div>
            </Card>
          ))}

          <Card padding="md">
            <p className="text-xs text-cream/50 mb-1">Support Hours</p>
            <p className="text-sm font-medium text-cream">Mon–Fri: 9AM–5PM EST</p>
            <p className="text-xs text-cream/50 mt-2">Compliance line: 24/7 for active workers</p>
          </Card>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <Card padding="lg">
            <h2 className="font-bold text-cream mb-5">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Full Name" value={form.name} onChange={up('name')} placeholder="Your name" required />
                <Input label="Email" type="email" value={form.email} onChange={up('email')} placeholder="you@email.com" required />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-cream/50">Subject</label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="input-dark appearance-none" required>
                  <option value="">Select a topic</option>
                  {['Application inquiry', 'Account issue', 'Compliance question', 'Technical problem', 'General inquiry', 'Other'].map(s => (
                    <option key={s} value={s} className="bg-[#1e1c35]">{s}</option>
                  ))}
                </select>
              </div>
              <Textarea label="Message" value={form.message} onChange={up('message')} placeholder="Tell us how we can help..." rows={5} required />
              <Button type="submit" loading={loading} size="lg" className="w-full" icon={<Send size={16} />}>
                Send Message
              </Button>
            </form>
          </Card>
        </div>
      </div>

    </div>
  );
}
