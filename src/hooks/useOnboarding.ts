import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { ONBOARDING_STEPS } from '../lib/constants';
import {
  completeTrainingModules,
  recordQuizAttempt,
  saveWorkerProfile,
  scheduleWorkerInterview,
  setWorkerOnboardingStep,
} from '../lib/onboardingData';

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
    try {
      await saveWorkerProfile(profile!.id, data);
      updateOnboardingStep('training');
      navigate('/onboarding/training');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeTraining() {
    setIsSubmitting(true);
    try {
      await completeTrainingModules(profile!.id, ['all']);
      updateOnboardingStep('quiz');
      navigate('/onboarding/quiz');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeQuiz(score: number) {
    setIsSubmitting(true);
    try {
      await recordQuizAttempt(profile!.id, score, score >= 70);
      updateOnboardingStep('interview');
      navigate('/onboarding/interview');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function scheduleInterview(scheduledAt: string) {
    setIsSubmitting(true);
    try {
      await scheduleWorkerInterview(profile!.id, scheduledAt);
      updateOnboardingStep('bank');
      navigate('/onboarding/bank');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveBankInfo(_data: { account_type: string; account_number: string; bank_name: string }) {
    setIsSubmitting(true);
    try {
      await setWorkerOnboardingStep(profile!.id, 'payout');
      updateOnboardingStep('payout');
      navigate('/onboarding/payout');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeFeeInstructions() {
    setIsSubmitting(true);
    try {
      await setWorkerOnboardingStep(profile!.id, 'payout', true);
      updateOnboardingStep('payout', true);
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
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
