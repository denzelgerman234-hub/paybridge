/**
 * AuthCallback — Supabase email verification callback handler
 *
 * Supabase sends a verification link of the form:
 *   <SITE_URL>/auth/callback?token_hash=<token>&type=email
 *
 * This page reads the query params, calls verifyOtp, and handles
 * all possible outcomes: success, expired, already-used, and invalid.
 *
 * In local mock mode, use these URLs to test each state:
 *   /auth/callback?token_hash=valid&type=email    → success → dashboard
 *   /auth/callback?token_hash=expired&type=email  → expired link state
 *   /auth/callback?token_hash=used&type=email     → already verified state
 *   /auth/callback?token_hash=anything&type=email → invalid token state
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

const GOLD  = '#C9A84C';
const CREAM = '#F1F0DA';
const DIM   = 'rgba(241,240,218,0.5)';
const TERRA = '#C8523D';

type CallbackState =
  | 'loading'
  | 'success'
  | 'expired'
  | 'already_verified'
  | 'invalid';

function isExpiredError(err: any): boolean {
  return (
    err?.code === 'otp_expired' ||
    (typeof err?.message === 'string' &&
      (err.message.toLowerCase().includes('expired') ||
        err.message.toLowerCase().includes('invalid token')))
  );
}

function isAlreadyUsedError(err: any): boolean {
  return (
    err?.code === 'otp_disabled' ||
    (typeof err?.message === 'string' &&
      err.message.toLowerCase().includes('already been used'))
  );
}

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [state, setState] = useState<CallbackState>('loading');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const tokenHash = searchParams.get('token_hash') ?? '';
  const type = (searchParams.get('type') ?? 'email') as 'email' | 'signup' | 'recovery';

  useEffect(() => {
    if (!tokenHash) {
      setState('invalid');
      return;
    }

    async function verify() {
      const { data, error } = await (supabase.auth as any).verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (!error) {
        // Success — a session was established; navigate to dashboard
        // Small delay so onAuthStateChange can process SIGNED_IN event first
        setTimeout(() => navigate('/dashboard', { replace: true }), 800);
        setState('success');
        return;
      }

      if (isAlreadyUsedError(error)) {
        setState('already_verified');
        return;
      }

      if (isExpiredError(error)) {
        setState('expired');
        return;
      }

      setState('invalid');
    }

    verify();
  }, [tokenHash, type]);

  async function handleResend() {
    if (!resendEmail || cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendDone(false);
    setResendError('');
    const { error } = await (supabase.auth as any).resend({ type: 'signup', email: resendEmail });
    setResendLoading(false);
    if (error) {
      setResendError('Could not send the verification email. Please try again.');
    } else {
      setResendDone(true);
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <Card padding="lg" className="text-center">
        <LoadingSpinner text="Verifying your email…" fullScreen={false} />
      </Card>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <Card padding="lg" className="text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <CheckCircle size={28} strokeWidth={1.5} style={{ color: '#10b981' }} />
        </div>
        <h1
          className="text-2xl font-black mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}
        >
          Email Verified
        </h1>
        <p className="text-sm mb-6" style={{ color: DIM }}>
          Your email has been confirmed. Taking you to your account…
        </p>
        <div className="flex justify-center">
          <div
            className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: `${GOLD} transparent ${GOLD} transparent` }}
          />
        </div>
      </Card>
    );
  }

  // ── Expired ───────────────────────────────────────────────────────────────
  if (state === 'expired') {
    return (
      <Card padding="lg" className="text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}
        >
          <Clock size={28} strokeWidth={1.5} style={{ color: GOLD }} />
        </div>
        <h1
          className="text-2xl font-black mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}
        >
          Link Expired
        </h1>
        <p className="text-sm mb-6" style={{ color: DIM }}>
          This verification link is no longer valid. Request a new one below and we'll send it to your email address.
        </p>

        {resendDone && (
          <div
            className="flex items-center justify-center gap-2 mb-4 text-xs px-3 py-2 rounded-lg"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
          >
            <CheckCircle size={14} />
            <span>New verification email sent — check your inbox.</span>
          </div>
        )}
        {resendError && (
          <p className="text-xs mb-4" style={{ color: TERRA }}>{resendError}</p>
        )}

        <div className="space-y-3 mb-5">
          <input
            type="email"
            className="input-dark w-full"
            placeholder="Enter your email address"
            value={resendEmail}
            onChange={e => setResendEmail(e.target.value)}
          />
          <Button
            type="button"
            className="w-full"
            onClick={handleResend}
            loading={resendLoading}
            disabled={!resendEmail || cooldown > 0}
          >
            <RefreshCw size={14} />
            {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Request New Verification Email'}
          </Button>
        </div>

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

  // ── Already Verified ──────────────────────────────────────────────────────
  if (state === 'already_verified') {
    return (
      <Card padding="lg" className="text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <CheckCircle size={28} strokeWidth={1.5} style={{ color: '#10b981' }} />
        </div>
        <h1
          className="text-2xl font-black mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}
        >
          Already Verified
        </h1>
        <p className="text-sm mb-6" style={{ color: DIM }}>
          Your email address has already been verified. You can sign in to your account now.
        </p>
        <Link to="/login">
          <Button className="w-full">
            Sign In
          </Button>
        </Link>
      </Card>
    );
  }

  // ── Invalid ───────────────────────────────────────────────────────────────
  return (
    <Card padding="lg" className="text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: 'rgba(200,82,61,0.1)', border: '1px solid rgba(200,82,61,0.25)' }}
      >
        <ShieldAlert size={28} strokeWidth={1.5} style={{ color: TERRA }} />
      </div>
      <h1
        className="text-2xl font-black mb-2"
        style={{ fontFamily: "'Space Grotesk', sans-serif", color: CREAM }}
      >
        Invalid Link
      </h1>
      <p className="text-sm mb-6" style={{ color: DIM }}>
        This verification link is not valid. It may have been modified or it no longer exists. Please sign in or request a new verification email.
      </p>
      <div className="space-y-3">
        <Link to="/login">
          <Button className="w-full">Sign In</Button>
        </Link>
        <Link to="/verify-email">
          <Button variant="outline" className="w-full">
            Request Verification Email
          </Button>
        </Link>
      </div>
    </Card>
  );
}
