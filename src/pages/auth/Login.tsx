import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, EmailNotConfirmedError } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Mail, Lock, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';

const GOLD = '#C9A84C';
const CREAM = '#F1F0DA';
const DIM = 'rgba(241,240,218,0.45)';
const TERRA = '#C8523D';
const RESEND_COOLDOWN_S = 60;

export function Login() {
  const { signIn, resendVerification, verifyTwoFactorLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2FA state
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Unverified-email state
  const [showUnverified, setShowUnverified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown() {
    setCooldownRemaining(RESEND_COOLDOWN_S);
    cooldownRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setShowUnverified(false);
    setLoading(true);
    try {
      if (showTwoFactor) {
        const clean = twoFactorCode.replace(/\D/g, '');
        if (clean.length !== 6) {
          setError('Enter the 6-digit code from your authenticator app');
          setLoading(false);
          return;
        }
        await verifyTwoFactorLogin(clean);
      } else {
        const result = await signIn(email, password);
        if (result?.needsTwoFactor) {
          setShowTwoFactor(true);
        }
      }
    } catch (err: any) {
      if (err instanceof EmailNotConfirmedError) {
        setShowUnverified(true);
      } else {
        setError(err.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldownRemaining > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);
    setResendError('');
    try {
      await resendVerification(email);
      setResendSuccess(true);
      startCooldown();
    } catch (err: any) {
      setResendError('Could not send the verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <Card padding="lg">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
          {showTwoFactor ? 'Two-Factor Auth' : 'Welcome back'}
        </h1>
        <p className="text-xs" style={{ color: DIM }}>
          {showTwoFactor
            ? 'Enter the code from your authenticator app'
            : 'Sign in to your PayBridge account'}
        </p>
      </div>

      {/* 2FA panel */}
      {showTwoFactor && (
        <div
          className="mb-5 p-4 rounded-lg flex items-start gap-3"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}
        >
          <ShieldCheck size={18} strokeWidth={1.5} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs leading-relaxed" style={{ color: DIM }}>
            Open <strong style={{ color: CREAM }}>Paybridge</strong> in your authenticator app and enter the 6-digit code below.
          </p>
        </div>
      )}

      {/* Unverified-email panel */}
      {showUnverified && (
        <div
          className="mb-5 p-4 rounded-lg"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}
        >
          <div className="flex items-start gap-3 mb-3">
            <Mail size={18} strokeWidth={1.5} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}>
                Email verification required
              </p>
              <p className="text-xs leading-relaxed" style={{ color: DIM }}>
                Your account exists but your email address hasn't been verified yet. Check your inbox for the PayBridge verification link from "Supabase Auth".
              </p>
            </div>
          </div>

          {resendSuccess && (
            <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: '#10b981' }}>
              <CheckCircle size={14} />
              <span>Verification email sent - check for the PayBridge link from "Supabase Auth".</span>
            </div>
          )}
          {resendError && (
            <p className="text-xs mb-3" style={{ color: TERRA }}>{resendError}</p>
          )}

          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || cooldownRemaining > 0}
            className="flex items-center gap-2 text-xs font-semibold transition-opacity"
            style={{
              color: cooldownRemaining > 0 ? DIM : GOLD,
              opacity: resendLoading || cooldownRemaining > 0 ? 0.6 : 1,
              cursor: cooldownRemaining > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={13} className={resendLoading ? 'animate-spin' : ''} />
            {cooldownRemaining > 0
              ? `Resend available in ${cooldownRemaining}s`
              : 'Resend verification email'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {!showTwoFactor ? (
          <>
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
          </>
        ) : (
          <Input
            label="6-digit authenticator code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={twoFactorCode}
            onChange={e => setTwoFactorCode(e.target.value)}
            placeholder="000000"
            required
            icon={<ShieldCheck size={16} />}
          />
        )}

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        {!showTwoFactor && (
          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-xs font-semibold transition-colors" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
              Forgot password?
            </Link>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {showTwoFactor ? 'Verify & Sign In' : 'Sign In'}
        </Button>

        {showTwoFactor && (
          <button
            type="button"
            onClick={() => { setShowTwoFactor(false); setTwoFactorCode(''); setError(''); }}
            className="w-full text-center text-xs transition-colors"
            style={{ color: DIM }}
          >
            ← Back to login
          </button>
        )}
      </form>

      {!showTwoFactor && (
        <>
          <div className="divider my-5" />
          <p className="text-center text-xs" style={{ color: DIM }}>
            Don't have an account?{' '}
            <Link to="/apply" className="font-bold transition-colors" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>Apply Now</Link>
          </p>

          <p className="text-center text-xs text-cream/50 mt-4 opacity-60">
            Use your PayBridge worker credentials to sign in.
          </p>
        </>
      )}
    </Card>
  );
}
