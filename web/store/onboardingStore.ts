import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingStore {
  showCreateOrg: boolean;
  setShowCreateOrg: (show: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  showCreateOrg: false,
  setShowCreateOrg: (show) => set({ showCreateOrg: show }),
}));

export type OnboardingStep =
  | "ORGANIZATION"
  | "MEMBERS"
  | "BILLING"
  | "INTEGRATION"
  | "EVENT";

export type PlanType = "free" | "pro" | "team";

export type MemberRole = "admin" | "member";

interface OnboardingState {
  currentStep: OnboardingStep;
  formData: {
    name: string;
    plan: PlanType;
    members: Array<{ email: string; role: MemberRole }>;
  };
  createdOrgId: string | null;
  setCurrentStep: (step: OnboardingStep) => void;
  setFormData: (data: Partial<OnboardingState["formData"]>) => void;
  setCreatedOrgId: (id: string | null) => void;
  resetOnboarding: () => void;
}

export const useOrgOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: "ORGANIZATION",
      formData: {
        name: "",
        plan: "free",
        members: [],
      },
      createdOrgId: null,
      setCurrentStep: (currentStep) => set({ currentStep }),
      setFormData: (formData) =>
        set((state) => ({ formData: { ...state.formData, ...formData } })),
      setCreatedOrgId: (id) => set({ createdOrgId: id }),
      resetOnboarding: () =>
        set({
          currentStep: "ORGANIZATION",
          formData: { name: "", plan: "free", members: [] },
          createdOrgId: null,
        }),
    }),
    {
      name: "onboarding-store",
    }
  )
);
