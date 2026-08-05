/**
 * ResetPassword
 *
 * Landed here from a "Forgot Password" email link.
 * Supabase has already established a temporary recovery session via
 * onAuthStateChange(PASSWORD_RECOVERY) in useAuth.ts.
 *
 * If the account has MFA enabled we must first elevate to AAL2
 * before updateUser() will succeed.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { ShieldCheck, Lock, ArrowLeft, CheckCircle } from 'lucide-react';

const GOLD  = '#C9A84C';
const CREAM = '#F1F0DA';
const DIM   = 'rgba(241,240,218,0.45)';

type Step = 'loading' | 'mfa' | 'form' | 'no_session';

export function ResetPassword() {
  const navigate  = useNavigate();
  const [step, setStep]                   = useState<Step>('loading');

  // MFA state
  const [mfaCode, setMfaCode]             = useState('');
  const [factorId, setFactorId]           = useState('');
  const [challengeId, setChallengeId]     = useState('');
  const [mfaLoading, setMfaLoading]       = useState(false);
  const [mfaError, setMfaError]           = useState('');

  // Password form state
  const [password, setPassword]           = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [formLoading, setFormLoading]     = useState(false);
  const [formError, setFormError]         = useState('');
  const [done, setDone]                   = useState(false);

  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    async function init() {
      // Give the session a moment to be set (PASSWORD_RECOVERY fires async)
      await new Promise(r => setTimeout(r, 300));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStep('no_session');
        return;
      }

      // Check if MFA elevation is needed
      try {
        const { data: aal }     = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.[0];

        if (totp && aal?.currentLevel !== 'aal2') {
          // Need to verify MFA before we can change the password
          const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
          if (challengeErr) throw challengeErr;
          setFactorId(totp.id);
          setChallengeId(challenge.id);
          setStep('mfa');
          return;
        }
      } catch {
        // MFA not enrolled or API failed — proceed to form
      }

      setStep('form');
    }

    void init();
  }, []);

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMfaError('');
    const clean = mfaCode.replace(/\D/g, '');
    if (clean.length !== 6) {
      setMfaError('Enter the 6-digit code from your authenticator app');
      return;
    }
    setMfaLoading(true);
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code: clean });
      if (error) throw error;
      setStep('form');
    } catch (err: any) {
      setMfaError(err.message || 'Invalid code. Please try again.');
    } finally {
      setMfaLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (password !== confirmPw) { setFormError('Passwords do not match'); return; }
    if (password.length < 8)    { setFormError('Password must be at least 8 characters'); return; }

    setFormLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success('Password updated!');
      // Sign out so the user logs in fresh with the new password
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setFormLoading(false);
    }
  }

  // ── No session ──────────────────────────────────────────────────────────────
  if (step === 'no_session') {
    return (
      <Card padding="lg" className="text-center">
        <h1 className="text-xl font-black mb-2" style={{ color: CREAM }}>Link Expired</h1>
        <p className="text-sm mb-6" style={{ color: DIM }}>
          This password reset link is no longer valid. Please request a new one.
        </p>
        <Link to="/forgot-password">
          <Button className="w-full">Request New Link</Button>
        </Link>
        <Link
          to="/login"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold mt-4 transition-colors"
          style={{ color: GOLD }}
        >
          <ArrowLeft size={13} /> Back to Sign In
        </Link>
      </Card>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <Card padding="lg" className="text-center">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin mx-auto"
          style={{ borderColor: `${GOLD} transparent ${GOLD} transparent` }}
        />
        <p className="text-sm mt-4" style={{ color: DIM }}>Verifying reset link…</p>
      </Card>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <Card padding="lg" className="text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <CheckCircle size={28} strokeWidth={1.5} style={{ color: '#10b981' }} />
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ color: CREAM }}>Password Updated!</h1>
        <p className="text-sm" style={{ color: DIM }}>Taking you to sign in…</p>
      </Card>
    );
  }

  // ── MFA step ─────────────────────────────────────────────────────────────────
  if (step === 'mfa') {
    return (
      <Card padding="lg">
        <div className="mb-6 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <ShieldCheck size={22} style={{ color: GOLD }} />
          </div>
          <h1 className="text-2xl font-black mb-1" style={{ color: CREAM }}>Two-Factor Auth</h1>
          <p className="text-sm" style={{ color: DIM }}>
            Enter your authenticator code to continue with the password reset.
          </p>
        </div>

        <form onSubmit={handleMfaSubmit} className="space-y-4">
          <Input
            label="Authenticator Code"
            type="text"
            inputMode="numeric"
            value={mfaCode}
            onChange={e => setMfaCode(e.target.value)}
            placeholder="000 000"
            required
            autoFocus
          />
          {mfaError && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded border border-red-400/20">
              {mfaError}
            </div>
          )}
          <Button type="submit" loading={mfaLoading} className="w-full">
            Verify &amp; Continue
          </Button>
        </form>
      </Card>
    );
  }

  // ── Password form ─────────────────────────────────────────────────────────────
  return (
    <Card padding="lg">
      <div className="mb-6 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
        >
          <Lock size={22} style={{ color: GOLD }} />
        </div>
        <h1 className="text-2xl font-black mb-1" style={{ color: CREAM }}>Set New Password</h1>
        <p className="text-sm" style={{ color: DIM }}>
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min 8 characters"
          required
          autoFocus
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={confirmPw}
          onChange={e => setConfirmPw(e.target.value)}
          placeholder="Re-enter password"
          required
        />

        {formError && (
          <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded border border-red-400/20">
            {formError}
          </div>
        )}

        <Button type="submit" loading={formLoading} className="w-full mt-2">
          Update Password
        </Button>
      </form>

      <Link
        to="/login"
        className="flex items-center justify-center gap-1.5 text-xs font-semibold mt-5 transition-colors"
        style={{ color: GOLD }}
      >
        <ArrowLeft size={13} /> Back to Sign In
      </Link>
    </Card>
  );
}
