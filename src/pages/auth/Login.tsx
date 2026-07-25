import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Mail, Lock } from 'lucide-react';

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="lg">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F1F0DA' }}>Welcome back</h1>
        <p className="text-xs" style={{ color: 'rgba(241,240,218,0.45)' }}>Sign in to your PayBridge account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com"
          required
          icon={<Mail size={16} />}
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="********"
          required
          icon={<Lock size={16} />}
        />

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-xs font-semibold transition-colors" style={{ color: '#C9A84C', fontFamily: "'Space Grotesk', sans-serif" }}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In
        </Button>
      </form>

      <div className="divider my-5" />
      <p className="text-center text-xs" style={{ color: 'rgba(241,240,218,0.45)' }}>
        Don't have an account?{' '}
        <Link to="/signup" className="font-bold transition-colors" style={{ color: '#C9A84C', fontFamily: "'Space Grotesk', sans-serif" }}>Apply Now</Link>
      </p>

      <p className="text-center text-xs text-cream/50 mt-4 opacity-60">
        Use your PayBridge worker credentials to sign in.
      </p>
    </Card>
  );
}
