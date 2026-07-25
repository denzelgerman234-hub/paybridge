import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export function Apply() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', country: '', referred_by: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
        <p className="text-gray-600 mb-6">Check your email for next steps to complete onboarding.</p>
        <Button onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply to Become a Worker</h1>
        <p className="text-gray-600">Complete your application and start your journey with PayBridge Workers.</p>
      </div>
      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <Input label="Country" required value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
          <Input label="Referred By (optional)" value={form.referred_by} onChange={e => setForm({ ...form, referred_by: e.target.value })} />
          <Button type="submit" className="w-full" loading={loading}>Submit Application</Button>
        </form>
      </Card>
    </div>
  );
}
