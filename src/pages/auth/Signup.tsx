import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { RiMailLine, RiLockLine, RiUserLine, RiPhoneLine, RiGlobalLine } from 'react-icons/ri';

const CREAM = '#F1F0DA';
const DIM   = 'rgba(241,240,218,0.45)';
const GOLD  = '#C9A84C';
const TERRA = '#C8523D';

export function Signup() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', country: 'US', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      await signUp(form.email, form.password, form.fullName, form.phone, form.country);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
          Create Account
        </h1>
        <p className="text-xs" style={{ color: DIM }}>Start your PayBridge worker journey</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Legal Name" value={form.fullName} onChange={update('fullName')} placeholder="As on your ID" required
          icon={<RiUserLine style={{ fontSize: 16, color: DIM }} />} />
        <Input label="Email Address" type="email" value={form.email} onChange={update('email')} placeholder="you@email.com" required
          icon={<RiMailLine style={{ fontSize: 16, color: DIM }} />} />
        <Input label="Phone Number" type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 555 000 1234" required
          icon={<RiPhoneLine style={{ fontSize: 16, color: DIM }} />} />

        <div className="space-y-1.5">
          <label className="label-caps block">Country</label>
          <select value={form.country} onChange={update('country')} className="input-dark appearance-none" required>
            {['US'].map(c => (
              <option key={c} value={c} style={{ background: '#12203F' }}>{c}</option>
            ))}
          </select>
        </div>

        <Input label="Password" type="password" value={form.password} onChange={update('password')} placeholder="Min 8 characters" required
          icon={<RiLockLine style={{ fontSize: 16, color: DIM }} />} />
        <Input label="Confirm Password" type="password" value={form.confirm} onChange={update('confirm')} placeholder="Repeat password" required
          icon={<RiLockLine style={{ fontSize: 16, color: DIM }} />} />

        {error && <p className="text-xs text-center" style={{ color: TERRA }}>{error}</p>}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create Account
        </Button>
      </form>

      <div className="divider my-5" />
      <p className="text-center text-xs" style={{ color: DIM }}>
        Already have an account?{' '}
        <Link to="/login" className="font-bold" style={{ color: GOLD }}>Sign In</Link>
      </p>
      <p className="text-center text-xs mt-2" style={{ color: 'rgba(241,240,218,0.25)' }}>
        By signing up you agree to our{' '}
        <Link to="/terms" className="underline" style={{ color: DIM }}>Terms</Link> and{' '}
        <Link to="/privacy" className="underline" style={{ color: DIM }}>Privacy Policy</Link>.
      </p>
    </Card>
  );
}

