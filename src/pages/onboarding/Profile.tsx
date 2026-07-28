import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { saveWorkerProfile } from '../../lib/onboardingData';
import { useAppStore } from '../../stores/appStore';
import { ONBOARDING_STEPS } from '../../lib/constants';
import { User, Phone, Globe } from 'lucide-react';

const COUNTRIES = ['United States'];

export function OnboardingProfile() {
  const { profile, updateOnboardingStep } = useAppStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone:     profile?.phone     || '',
    country:   profile?.country   || '',
    address_city: profile?.address_city || '',
  });
  const [loading, setLoading] = useState(false);

  const up = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await saveWorkerProfile(profile!.id, form);
      updateOnboardingStep('training');
      navigate('/onboarding/training');
    } finally {
      setLoading(false);
    }
  }

  const stepIdx = ONBOARDING_STEPS.findIndex(s => s.id === 'profile') + 1;

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
          Step {stepIdx} of {ONBOARDING_STEPS.length} — Personal Info
        </p>
        <h1 className="text-3xl font-black text-cream">Tell Us About Yourself</h1>
        <p className="text-cream/50 mt-1">This information is used for identity verification and your worker profile.</p>
      </div>

      <ProgressBar value={stepIdx} max={ONBOARDING_STEPS.length} label="Onboarding progress" showPercent />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Legal Name" value={form.full_name} onChange={up('full_name')} placeholder="As on your government ID" required icon={<User size={15} />} />
          <Input label="Phone Number" type="tel" value={form.phone} onChange={up('phone')} placeholder="+1 555 000 1234" required icon={<Phone size={15} />} />
          <Input label="City" value={form.address_city} onChange={up('address_city')} placeholder="Your city" icon={<Globe size={15} />} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-cream/50">Country</label>
            <select value={form.country} onChange={up('country')} className="input-dark appearance-none" required>
              <option value="">Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c} className="bg-[#1e1c35]">{c}</option>)}
            </select>
          </div>
          <div className="pt-2">
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Continue to Training →
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


