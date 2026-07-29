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

function friendlySignupError(err: any): string {
  const raw = err?.message ?? err?.msg ?? err?.error_description ?? '';
  const message = typeof raw === 'string' ? raw.trim() : '';
  const isEmpty = !message || message === '{}' || message === '[]';
  const lower = message.toLowerCase();

  if (err?.code === 'supabase_not_configured') {
    return 'Signup is not connected yet. Please contact support.';
  }
  if (lower.includes('already registered') || lower.includes('already exists') || lower.includes('user already')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (lower.includes('invalid email')) {
    return 'Enter a valid email address.';
  }
  if (lower.includes('password')) {
    return message;
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many signup attempts. Please wait a moment and try again.';
  }
  if (isEmpty) return 'Account creation failed. Please try again.';
  return message;
}

export function Signup() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', country: 'US', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!fullName || !email || !phone || !form.country || !form.password || !form.confirm) {
      setError('Please complete all required fields.');
      return;
    }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setError(''); setLoading(true);
    try {
      await signUp(email, form.password, fullName, phone, form.country);
    } catch (err: any) {
      console.error('[paybridge] Create Account failed', err);
      setError(friendlySignupError(err));
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

        <Button type="submit" loading={loading} disabled={loading} className="w-full" size="lg">
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
