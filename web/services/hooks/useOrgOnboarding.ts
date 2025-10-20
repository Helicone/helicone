import { $JAWN_API } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useKeys } from "@/components/templates/keys/useKeys";
import { useProvider } from "@/hooks/useProvider";

export type OnboardingStep = "ORGANIZATION" | "MEMBERS" | "BILLING" | "REQUEST";

export type PlanType = "free" | "pro" | "team";

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
    members: { email: string; role: "admin" | "member" }[],
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
      },
    ),
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
  hasIntegrated: boolean;
  currentStep: "ORGANIZATION" | "MEMBERS" | "BILLING" | "REQUEST";
  selectedTier: "free" | "pro" | "team";
  members: { email: string; role: "admin" | "member" }[];
  addons: {
    prompts: boolean;
    experiments: boolean;
    evals: boolean;
  };
  hasCompletedQuickstart: boolean;
}

const defaultOnboardingState: OnboardingState = {
  name: "",
  hasOnboarded: false,
  hasIntegrated: false,
  hasCompletedQuickstart: false,
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
  const jawn = useJawnClient();
  const { keys, refetchKeys } = useKeys();
  const { providerKeys, refetchProviderKeys } = useProvider();

  const draftStore = useDraftOnboardingStore(orgId);
  const {
    draftName,
    setDraftName,
    draftPlan,
    setDraftPlan,
    draftMembers,
    setDraftMembers,
    draftAddons,
    clearDraft,
  } = draftStore();

  const { data: onboardingState, isLoading } = $JAWN_API.useQuery(
    "get",
    "/v1/organization/{organizationId}",
    {
      params: { path: { organizationId: orgId } },
    },
    {
      enabled: !!orgId,
      select: (data) => {
        const organization = data?.data;
        if (!organization) {
          return null;
        }
        const baseState =
          (organization?.onboarding_status as unknown as OnboardingState) ??
          defaultOnboardingState;

        return { ...baseState, name: organization?.name ?? "" };
      },
    },
  );

  const hasCompletedQuickstart = onboardingState?.hasCompletedQuickstart ?? false;

  useEffect(() => {
    if (
      onboardingState &&
      !draftName &&
      onboardingState.name !== "My Organization"
    ) {
      setDraftName(onboardingState.name);
    }
  }, []);

  // A cleaner solution for this would be to have the source hooks automatically be
  // invalidated when a new key is created. This is implemented but NOT working.
  // 90/10 solution.
  useEffect(() => {
    if (!hasCompletedQuickstart) {
      const keysInterval = setInterval(() => {
        refetchKeys();
      }, 5000);
      
      const providerKeysInterval = setInterval(() => {
        refetchProviderKeys();
      }, 5000);

      return () => {
        clearInterval(keysInterval);
        clearInterval(providerKeysInterval);
      };
    }
  }, [hasCompletedQuickstart, refetchKeys, refetchProviderKeys]);

  const hasKeys = useMemo(() => {
    if (keys?.isLoading) {
      return undefined;
    }
    return (keys?.data?.data?.data?.length ?? 0) > 0;
  }, [keys]);
  
  const hasProviderKeys = useMemo(() => {
    return providerKeys && providerKeys.length > 0;
  }, [providerKeys]);

  const currentState = {
    ...onboardingState,
    selectedTier: draftPlan,
    members: draftMembers,
  };

  const { mutateAsync: saveOnboardingChangesAsync } = useMutation({
    mutationFn: async (newState: Partial<OnboardingState>) => {
      const fullState = {
        hasOnboarded:
          newState.hasOnboarded ?? onboardingState?.hasOnboarded,
        hasIntegrated:
          newState.hasIntegrated ?? onboardingState?.hasIntegrated,
        hasCompletedQuickstart:
          newState.hasCompletedQuickstart ??
          onboardingState?.hasCompletedQuickstart,
        currentStep:
          newState.currentStep ??
          onboardingState?.currentStep ??
          "ORGANIZATION",
        selectedTier: draftPlan,
        members: draftMembers,
        addons: draftAddons,
      };

      const { data, error } = await jawn.POST(
        "/v1/organization/update_onboarding",
        {
          body: {
            onboarding_status: fullState,
            name: draftName || onboardingState?.name || "",
          },
        },
      );

      if (error) {
        console.error("Update failed:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", orgId, "onboarding"],
      });
    },
  });

  const updateCurrentStep = async (step: OnboardingState["currentStep"]) => {
    await saveOnboardingChangesAsync({ currentStep: step });
    await queryClient.invalidateQueries({
      queryKey: ["org", orgId, "onboarding"],
    });
    await queryClient.refetchQueries({
      queryKey: ["org", orgId, "onboarding"],
    });
  };

  const updateOnboardingStatus = async (status: Partial<OnboardingState>) => {
    await saveOnboardingChangesAsync(status);
    clearDraft();
    await queryClient.invalidateQueries({
      queryKey: ["org", orgId, "onboarding"],
    });
    await queryClient.refetchQueries({
      queryKey: ["org", orgId, "onboarding"],
    });
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
    updateOnboardingStatus,
    hasKeys,
    hasProviderKeys,
    refetchProviderKeys,
    refetchKeys: keys.refetch,
  };
};
