import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { setWorkerOnboardingStep, listWorkerBankAccounts } from '../../lib/onboardingData';
import { useAppStore } from '../../stores/appStore';
import { ONBOARDING_STEPS } from '../../lib/constants';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BankAccountsManager } from '../../components/account/BankAccountsManager';

export function OnboardingBank() {
  const { profile, updateOnboardingStep } = useAppStore();
  const navigate = useNavigate();
  const [hasAccounts, setHasAccounts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAccounts, setCheckingAccounts] = useState(true);

  const stepIdx = ONBOARDING_STEPS.findIndex(s => s.id === 'bank') + 1;

  useEffect(() => {
    if (!profile) return;
    let active = true;
    setCheckingAccounts(true);
    listWorkerBankAccounts(profile.id)
      .then(accounts => {
        if (active) setHasAccounts(accounts.length > 0);
      })
      .finally(() => {
        if (active) setCheckingAccounts(false);
      });
    return () => { active = false; };
  }, [profile]);

  async function handleContinue() {
    if (!hasAccounts) return;
    setLoading(true);
    try {
      await setWorkerOnboardingStep(profile!.id, 'payout');
      updateOnboardingStep('payout');
      navigate('/onboarding/payout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">
          Step {stepIdx} of {ONBOARDING_STEPS.length} - Disbursement Accounts
        </p>
        <h1 className="text-3xl font-black text-cream">Set Up Dedicated Accounts</h1>
      </div>

      <ProgressBar value={stepIdx} max={ONBOARDING_STEPS.length} label="Onboarding progress" showPercent />

      <div className="rounded p-4 flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
        <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-400 text-sm">Important: Dedicated Accounts Only</p>
          <p className="text-xs text-cream/50 mt-1">
            These accounts are for PayBridge transactions <strong className="text-cream">only</strong>. No personal spending.
            The principal funds deposited here are <strong className="text-cream">not your money</strong>.
            Your worker fee is handled through the funded gig record after Operations verifies completion.
          </p>
        </div>
      </div>

      {profile && (
        <BankAccountsManager
          workerId={profile.id}
          onboarding
          onReadyChange={setHasAccounts}
        />
      )}

      <Button className="w-full" size="lg" onClick={handleContinue} loading={loading} disabled={!hasAccounts || checkingAccounts}>
        Review Fee Instructions
      </Button>

      <Card padding="md">
        <h3 className="font-bold text-cream text-sm mb-3">What happens after you add accounts:</h3>
        <ol className="space-y-2">
          {[
            'Add dedicated checking or savings accounts',
            'Group accounts by partner bank',
            'Mark the primary account Operations should fund first',
            'Operations reviews the accounts for dedicated use',
            'Approved accounts become available for funded gigs',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-cream/50">
              <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-gold" style={{ background: 'rgba(201,168,76,0.15)' }}>
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
