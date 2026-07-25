import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';
import { ONBOARDING_STEPS } from '../../lib/constants';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CheckCircle, Star, CreditCard, AlertTriangle } from 'lucide-react';

export function OnboardingPayout() {
  const { profile, updateOnboardingStep } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const stepIdx = ONBOARDING_STEPS.findIndex(s => s.id === 'payout') + 1;

  async function handleSave() {
    setLoading(true);
    await supabase.from('worker_profiles').update({
      onboarding_step: 'payout',
      onboarding_completed: true,
    }).eq('id', profile!.id);
    updateOnboardingStep('payout', true);
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <Card padding="lg">
          <div className="text-center">
            <div className="w-14 h-14 rounded mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(125,201,154,0.1)', border: '1px solid rgba(125,201,154,0.25)' }}>
              <CheckCircle size={28} strokeWidth={1.5} style={{ color: '#7DC99A' }} />
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#F1F0DA' }}>You're All Set</h2>
            <p className="mb-6" style={{ color: 'rgba(241,240,218,0.5)', fontSize: 14 }}>Onboarding complete. Welcome to PayBridge.</p>
            <div className="card p-4 mb-6 text-sm text-left space-y-2.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={13} style={{ color: '#7DC99A', flexShrink: 0 }} />
                <span style={{ color: '#F1F0DA' }}>Status: <strong style={{ color: '#7DC99A' }}>Active</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Star size={13} strokeWidth={1.5} style={{ color: '#C9A84C', flexShrink: 0 }} />
                <span style={{ color: '#F1F0DA' }}>Badge: <strong>Trainee</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <CreditCard size={13} strokeWidth={1.5} style={{ color: 'rgba(241,240,218,0.5)', flexShrink: 0 }} />
                <span style={{ color: '#F1F0DA' }}>Worker fee: <strong style={{ color: 'rgba(241,240,218,0.6)' }}>Handled through each gig record</strong></span>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
          Step {stepIdx} of {ONBOARDING_STEPS.length} - Worker Fee Instructions
        </p>
        <h1 className="text-3xl font-black text-cream">Confirm Worker Fee Handling</h1>
        <p className="text-cream/50 mt-1">Your fee is included in the funded gig amount and recorded after Operations verifies completion.</p>
      </div>

      <ProgressBar value={stepIdx} max={ONBOARDING_STEPS.length} label="Onboarding progress" showPercent />

      <div className="rounded p-4 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-cream/50">
          PayBridge does not hold a platform balance for you. All principal and worker-fee movement is recorded against the gig, and Operations confirms each status change.
        </p>
      </div>

      <Card padding="md">
        <div className="space-y-3 text-sm text-cream/60">
          <p>Your dedicated disbursement account receives the approved gig amount before any beneficiary disbursement begins.</p>
          <p>After the gig is verified, the worker fee is recorded in the transaction history for that gig.</p>
          <p>Keep proof files and references attached to each beneficiary record so Operations can review them later.</p>
        </div>
      </Card>

      <Button className="w-full" size="lg" onClick={handleSave} loading={loading}>
        Acknowledge & Complete Onboarding
      </Button>
    </div>
  );
}
