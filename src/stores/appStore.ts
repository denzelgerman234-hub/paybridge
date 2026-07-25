import { create } from 'zustand';
import { WorkerProfile, BadgeTier } from '../types/database';

interface AppState {
  profile: WorkerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setProfile: (profile: WorkerProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (auth: boolean) => void;
  updateBadge: (badge: BadgeTier) => void;
  updateOnboardingStep: (step: WorkerProfile['onboarding_step'], completed?: boolean) => void;
  addCompletedGig: () => void;
  addDisbursed: (amount: number) => void;
  addEarned: (amount: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  updateBadge: (badge) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, badge } : null,
    })),
  updateOnboardingStep: (step, completed) =>
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, onboarding_step: step, onboarding_completed: completed ?? state.profile.onboarding_completed }
        : null,
    })),
  addCompletedGig: () =>
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, total_gigs_completed: state.profile.total_gigs_completed + 1 }
        : null,
    })),
  addDisbursed: (amount) =>
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, total_disbursed: state.profile.total_disbursed + amount }
        : null,
    })),
  addEarned: (amount) =>
    set((state) => ({
      profile: state.profile
        ? { ...state.profile, total_earned: state.profile.total_earned + amount }
        : null,
    })),
}));
