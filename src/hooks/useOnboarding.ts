import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import { OnboardingStep } from '../types/database';
import { ONBOARDING_STEPS } from '../lib/constants';

export function useOnboarding() {
  const { profile, updateOnboardingStep } = useAppStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStepIndex = ONBOARDING_STEPS.findIndex((s) => s.id === profile?.onboarding_step);
  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const totalSteps = ONBOARDING_STEPS.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  async function saveProfile(data: { full_name: string; phone: string; country: string; avatar_url?: string }) {
    setIsSubmitting(true);
    const { error } = await supabase
      .from('worker_profiles')
      .update({ ...data, onboarding_step: 'training' })
      .eq('id', profile!.id);

    if (error) throw error;
    updateOnboardingStep('training');
    navigate('/onboarding/training');
    setIsSubmitting(false);
  }

  async function completeTraining() {
    setIsSubmitting(true);
    await supabase.from('training_progress').insert({
      worker_id: profile!.id,
      module_id: 'all',
      completed: true,
    });
    updateOnboardingStep('quiz');
    navigate('/onboarding/quiz');
    setIsSubmitting(false);
  }

  async function completeQuiz(score: number) {
    setIsSubmitting(true);
    await supabase.from('quiz_attempts').insert({
      worker_id: profile!.id,
      score,
      passed: score >= 70,
    });
    updateOnboardingStep('interview');
    navigate('/onboarding/interview');
    setIsSubmitting(false);
  }

  async function scheduleInterview(scheduledAt: string) {
    setIsSubmitting(true);
    await supabase.from('interview_slots').insert({
      worker_id: profile!.id,
      scheduled_at: scheduledAt,
    });
    updateOnboardingStep('bank');
    navigate('/onboarding/bank');
    setIsSubmitting(false);
  }

  async function saveBankInfo(_data: { account_type: string; account_number: string; bank_name: string }) {
    setIsSubmitting(true);
    await supabase.from('worker_profiles').update({ onboarding_step: 'payout' }).eq('id', profile!.id);
    updateOnboardingStep('payout');
    navigate('/onboarding/payout');
    setIsSubmitting(false);
  }

  async function completeFeeInstructions() {
    setIsSubmitting(true);
    await supabase
      .from('worker_profiles')
      .update({ onboarding_completed: true, onboarding_step: 'payout' })
      .eq('id', profile!.id);
    updateOnboardingStep('payout', true);
    navigate('/dashboard');
    setIsSubmitting(false);
  }

  return {
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    isSubmitting,
    saveProfile,
    completeTraining,
    completeQuiz,
    scheduleInterview,
    saveBankInfo,
    completeFeeInstructions,
  };
}

