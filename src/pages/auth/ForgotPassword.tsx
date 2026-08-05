import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { supabase } from '../../lib/supabase';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const GOLD  = '#C9A84C';
const CREAM = '#F1F0DA';
const DIM   = 'rgba(241,240,218,0.5)';
const TERRA = '#C8523D';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { emailRedirectTo: `${window.location.origin}/auth/callback?type=recovery` },
    );
    setLoading(false);
    if (err) {
      setError('Could not send the reset link. Please try again.');
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Card padding="lg" className="text-center">
        {/* Success icon */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.25)',
          }}
        >
          <CheckCircle size={26} strokeWidth={1.5} style={{ color: '#10b981' }} />
        </div>

        <h1
          className="text-2xl font-black mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}
        >
          Check Your Email
        </h1>
        <p className="text-sm mb-1" style={{ color: DIM }}>
          We've sent a password reset link to
        </p>
        <p
          className="text-sm font-semibold mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}
        >
          {email}
        </p>
        <p className="text-xs mb-6" style={{ color: DIM }}>
          Click the link in the email to set a new password. If you don't see it, check your spam folder.
        </p>

        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
          style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <ArrowLeft size={13} />
          Back to Sign In
        </Link>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="mb-7 text-center">
        <h1
          className="text-2xl font-black mb-1"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}
        >
          Reset Password
        </h1>
        <p className="text-xs" style={{ color: DIM }}>
          Enter your email and we'll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com"
          icon={<Mail size={16} />}
        />

        {error && <p className="text-xs text-center" style={{ color: TERRA }}>{error}</p>}

        <Button type="submit" className="w-full" loading={loading} size="lg">
          Send Reset Link
        </Button>
      </form>

      <div className="divider my-5" />
      <p className="text-center text-xs" style={{ color: DIM }}>
        Remembered it?{' '}
        <Link
          to="/login"
          className="font-bold transition-colors"
          style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Back to Sign In
        </Link>
      </p>
    </Card>
  );
}
