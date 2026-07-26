import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';

const GOLD  = '#C9A84C';
const CREAM = '#F1F0DA';
const DIM   = 'rgba(241,240,218,0.5)';
const TERRA = '#C8523D';
const RESEND_COOLDOWN_S = 60;

/** Mask an email for display: jo***@example.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return email;
  return `${local.slice(0, 2)}${'*'.repeat(Math.min(local.length - 2, 4))}@${domain}`;
}

export function VerifyEmail() {
  const location = useLocation();
  const { resendVerification, pendingEmail } = useAuth();

  // Prefer router location state, fall back to appStore pendingEmail, then localStorage
  const routeEmail = (location.state as any)?.email ?? '';
  const email = routeEmail || pendingEmail || localStorage.getItem('pb_pending_email') || '';

  // Persist email to localStorage so it survives a page refresh
  useEffect(() => {
    if (email) localStorage.setItem('pb_pending_email', email);
  }, [email]);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError]     = useState('');
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

  async function handleResend() {
    if (cooldownRemaining > 0 || resendLoading || !email) return;
    setResendLoading(true);
    setResendSuccess(false);
    setResendError('');
    try {
      await resendVerification(email);
      setResendSuccess(true);
      startCooldown();
    } catch {
      setResendError('Could not send the verification email. Please try again shortly.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <Card padding="lg" className="text-center">
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{
          background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.25)',
        }}
      >
        <Mail size={26} strokeWidth={1.5} style={{ color: GOLD }} />
      </div>

      <h1
        className="text-2xl font-black mb-2"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}
      >
        Check Your Email
      </h1>

      <p className="text-sm leading-relaxed mb-1" style={{ color: DIM }}>
        We've sent a verification link to
      </p>
      {email && (
        <p
          className="text-sm font-semibold mb-5"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}
        >
          {maskEmail(email)}
        </p>
      )}
      {!email && (
        <p className="text-sm mb-5" style={{ color: DIM }}>
          your registered email address.
        </p>
      )}

      <p className="text-xs mb-6" style={{ color: DIM }}>
        Click the link in that email to activate your account, then sign in.
        If you don't see it, check your spam folder.
      </p>

      {/* Resend feedback */}
      {resendSuccess && (
        <div
          className="flex items-center justify-center gap-2 mb-4 text-xs px-3 py-2 rounded-lg"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
        >
          <CheckCircle size={14} />
          <span>Verification email sent - check your inbox.</span>
        </div>
      )}
      {resendError && (
        <p className="text-xs mb-4" style={{ color: TERRA }}>{resendError}</p>
      )}

      {/* Resend button */}
      <Button
        type="button"
        variant="outline"
        className="w-full mb-4"
        onClick={handleResend}
        loading={resendLoading}
        disabled={cooldownRemaining > 0}
      >
        <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
        {cooldownRemaining > 0
          ? `Resend available in ${cooldownRemaining}s`
          : 'Resend verification email'}
      </Button>

      {/* Back to Sign In */}
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
