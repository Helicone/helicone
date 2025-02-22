import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useEffect } from "react";

// Define draft state interface
interface DraftOnboardingState {
  draftName: string;
  draftPlan: "free" | "pro" | "team";
  draftMembers: { email: string; role: "admin" | "member" }[];
  draftAddons: {
    prompts: boolean;
    experiments: boolean;
    evals: boolean;
  };
  setDraftName: (name: string) => void;
  setDraftPlan: (plan: "free" | "pro" | "team") => void;
  setDraftMembers: (
    members: { email: string; role: "admin" | "member" }[]
  ) => void;
  setDraftAddons: (addons: {
    prompts: boolean;
    experiments: boolean;
    evals: boolean;
  }) => void;
  clearDraft: () => void;
}

const createDraftStore = (orgId: string) => {
  return create<DraftOnboardingState>()(
    persist(
      (set) => ({
        draftName: "",
        draftPlan: "free",
        draftMembers: [],
        draftAddons: {
          prompts: false,
          experiments: false,
          evals: false,
        },
        setDraftName: (name) => set({ draftName: name }),
        setDraftPlan: (plan) => set({ draftPlan: plan }),
        setDraftMembers: (members) => set({ draftMembers: members }),
        setDraftAddons: (addons) => set({ draftAddons: addons }),
        clearDraft: () =>
          set({ draftName: "", draftPlan: "free", draftMembers: [] }),
      }),
      {
        name: `onboarding-draft-storage-${orgId}`,
        skipHydration: true, // Skip initial hydration
      }
    )
  );
};

const storeCache = new Map<string, ReturnType<typeof createDraftStore>>();

export const useDraftOnboardingStore = (orgId: string) => {
  useEffect(() => {
    // Hydrate the store after mount
    if (storeCache.has(orgId)) {
      storeCache.get(orgId)!.persist.rehydrate();
    }
  }, [orgId]);

  if (!storeCache.has(orgId)) {
    storeCache.set(orgId, createDraftStore(orgId));
  }
  return storeCache.get(orgId)!;
};

export interface OnboardingState {
  name: string;
  hasOnboarded: boolean;
  currentStep: "ORGANIZATION" | "MEMBERS" | "BILLING" | "INTEGRATION" | "EVENT";
  selectedTier: "free" | "pro" | "team";
  members: { email: string; role: "admin" | "member" }[];
  addons: {
    prompts: boolean;
    experiments: boolean;
    evals: boolean;
  };
}

const defaultOnboardingState: OnboardingState = {
  name: "",
  hasOnboarded: false,
  currentStep: "ORGANIZATION",
  selectedTier: "free",
  members: [],
  addons: {
    prompts: false,
    experiments: false,
    evals: false,
  },
};

export const useOrgOnboarding = (orgId: string) => {
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();
  const jawn = useJawnClient();

  // Get org-specific store
  const draftStore = useDraftOnboardingStore(orgId);
  const {
    draftName,
    setDraftName,
    draftPlan,
    setDraftPlan,
    draftMembers,
    setDraftMembers,
    draftAddons,
    setDraftAddons,
    clearDraft,
  } = draftStore();

  // Query to fetch onboarding state
  const { data: onboardingState, isLoading } = useQuery({
    queryKey: ["org", orgId, "onboarding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization")
        .select("name, onboarding_status")
        .eq("id", orgId)
        .single();

      if (error) throw error;

      const baseState =
        (data?.onboarding_status as OnboardingState) ?? defaultOnboardingState;

      return {
        ...baseState,
        name: data?.name ?? "",
      };
    },
    enabled: !!orgId,
  });

  const currentState = {
    ...onboardingState,
    selectedTier: draftPlan,
    members: draftMembers,
  };

  const {
    mutate: saveOnboardingChanges,
    mutateAsync: saveOnboardingChangesAsync,
  } = useMutation({
    mutationFn: async (newState: Partial<OnboardingState>) => {
      const fullState = {
        hasOnboarded: onboardingState?.hasOnboarded ?? false,
        currentStep:
          newState.currentStep ??
          onboardingState?.currentStep ??
          "ORGANIZATION",
        selectedTier: draftPlan,
        members: draftMembers,
        addons: draftAddons,
      };

      console.log("fullState: ", JSON.stringify(fullState, null, 2));
      console.log("draftName: ", draftName);

      const { data, error } = await jawn.POST(
        "/v1/organization/update_onboarding",
        {
          body: {
            onboarding_status: fullState,
            name: draftName || onboardingState?.name || "",
            has_onboarded: onboardingState?.hasOnboarded ?? false,
          },
        }
      );

      if (error) {
        console.error("Update failed:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["org", orgId, "onboarding"]);
    },
  });

  const updateCurrentStep = async (step: OnboardingState["currentStep"]) => {
    await saveOnboardingChangesAsync({ currentStep: step });
    await queryClient.invalidateQueries(["org", orgId, "onboarding"]);
    await queryClient.refetchQueries(["org", orgId, "onboarding"]);
  };

  const completeOnboarding = async () => {
    await saveOnboardingChangesAsync({ hasOnboarded: true });
    await queryClient.invalidateQueries(["org", orgId, "onboarding"]);
    await queryClient.refetchQueries(["org", orgId, "onboarding"]);
  };

  const resetOnboarding = () => {
    clearDraft();
  };

  return {
    onboardingState: currentState,
    isLoading,
    draftName,
    setDraftName,
    draftPlan,
    setDraftPlan,
    draftMembers,
    setDraftMembers,
    updateCurrentStep,
    resetOnboarding: clearDraft,
  };
};
