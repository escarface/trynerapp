import { create } from 'zustand';

export interface OnboardingData {
  age?: number;
  weight?: number;
  height?: number;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goal?: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_health';
}

interface OnboardingState {
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  
  // Actions
  updateData: (updates: Partial<OnboardingData>) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  data: {},
  currentStep: 0,
  totalSteps: 3, // Basics (Age/Weight/Height), Fitness Level, Goal

  updateData: (updates) =>
    set((state) => ({
      data: { ...state.data, ...updates },
    })),

  setStep: (step) => set({ currentStep: step }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  reset: () =>
    set({
      data: {},
      currentStep: 0,
    }),
}));
