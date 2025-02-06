import { create } from "zustand";

interface OnboardingStore {
  showCreateOrg: boolean;
  setShowCreateOrg: (show: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  showCreateOrg: false,
  setShowCreateOrg: (show) => set({ showCreateOrg: show }),
}));
