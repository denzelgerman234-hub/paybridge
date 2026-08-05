import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { ShieldCheck, Lock } from 'lucide-react';

const CREAM = '#F1F0DA';
const DIM = 'rgba(241,240,218,0.45)';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }
      
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (totpFactor && aal.data?.currentLevel === 'aal1') {
        setNeedsMfa(true);
        setFactorId(totpFactor.id);
        const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
        if (challenge.data) {
          setChallengeId(challenge.data.id);
        }
      }
    }
    void checkSession();
  }, [navigate]);

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    setMfaError('');
    if (mfaCode.replace(/\D/g, '').length !== 6) {
      setMfaError('Enter a valid 6-digit code');
      return;
    }
    setMfaLoading(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: mfaCode,
      });
      if (error) throw error;
      setNeedsMfa(false);
    } catch (err: any) {
      setMfaError(err.message || 'Invalid code');
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success('Password updated successfully');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  if (needsMfa) {
    return (
      <Card padding="lg">
        <div className="mb-7 text-center">
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={24} className="text-gold" />
          </div>
          <h1 className="text-2xl font-black mb-1" style={{ color: CREAM }}>Two-Factor Auth</h1>
          <p className="text-sm" style={{ color: DIM }}>
            Please enter your authenticator code to proceed with password reset.
          </p>
        </div>
        <form onSubmit={handleVerifyMfa} className="space-y-4">
          <Input
            label="Authenticator Code"
            type="text"
            inputMode="numeric"
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder="000000"
            required
            autoFocus
          />
          {mfaError && <div className="text-red-400 text-sm mt-2">{mfaError}</div>}
          <Button type="submit" loading={mfaLoading} className="w-full mt-2">
            Verify Code
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <div className="mb-7 text-center">
        <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-gold" />
        </div>
        <h1 className="text-2xl font-black mb-1" style={{ color: CREAM }}>Reset Password</h1>
        <p className="text-sm" style={{ color: DIM }}>
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min 8 characters"
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          required
        />

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded mt-2 border border-red-400/20">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full mt-4">
          Update Password
        </Button>
      </form>
    </Card>
  );
}
