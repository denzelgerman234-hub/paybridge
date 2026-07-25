import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Mail, MessageCircle, HelpCircle } from 'lucide-react';

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h1>
        <p className="text-gray-600">We'll get back to you within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Contact Us</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { icon: Mail, title: 'Email', text: 'support@paybridgeworkers.com' },
          { icon: MessageCircle, title: 'Live Chat', text: 'Available 9am-5pm EST' },
          { icon: HelpCircle, title: 'Help Center', text: 'Visit our FAQ section' },
        ].map(({ icon: Icon, title, text }) => (
          <Card key={title} padding="md" className="text-center">
            <Icon size={24} className="text-primary-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{text}</p>
          </Card>
        ))}
      </div>
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" required />
          <Input label="Email" type="email" required />
          <Input label="Subject" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500" rows={4} required />
          </div>
          <Button type="submit" className="w-full">Send Message</Button>
        </form>
      </Card>
    </div>
  );
}
