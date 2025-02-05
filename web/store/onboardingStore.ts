import { create } from "zustand";

interface OnboardingStore {
  showEndOnboardingConfirmation: boolean;
  setShowEndOnboardingConfirmation: (show: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  showEndOnboardingConfirmation: false,
  setShowEndOnboardingConfirmation: (show) =>
    set({ showEndOnboardingConfirmation: show }),
}));
