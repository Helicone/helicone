import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface OnboardingState {
  currentStep: "ORGANIZATION" | "MEMBERS" | "BILLING" | "INTEGRATION" | "EVENT";
  formData: {
    name: string;
    plan: "free" | "pro" | "team";
    addons: {
      prompts: boolean;
      experiments: boolean;
      evals: boolean;
    };
    members: Array<{ email: string; role: "admin" | "member" }>;
  };
}

const defaultFormData = {
  name: "",
  plan: "free" as const,
  addons: { prompts: false, experiments: false, evals: false },
  members: [],
};

const defaultOnboardingState: OnboardingState = {
  currentStep: "ORGANIZATION",
  formData: defaultFormData,
};

export const useOrgOnboarding = (orgId: string) => {
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();

  // Query to fetch onboarding state
  const { data: onboardingState } = useQuery({
    queryKey: ["org", orgId, "onboarding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization")
        .select("onboarding_status")
        .eq("id", orgId)
        .single();

      if (error) throw error;
      // Return default state if onboarding_status is empty
      return (
        (data.onboarding_status as OnboardingState) || defaultOnboardingState
      );
    },
    // Enable query only if we have an orgId
    enabled: !!orgId,
  });

  // Mutation to update onboarding state
  const { mutate: updateOnboarding } = useMutation({
    mutationFn: async (newState: Partial<OnboardingState>) => {
      const { error } = await supabase
        .from("organization")
        .update({
          onboarding_status: {
            ...onboardingState,
            ...newState,
          },
        })
        .eq("id", orgId);

      if (error) throw error;
    },
    // Optimistically update the UI
    onMutate: async (newState) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(["org", orgId, "onboarding"]);

      // Snapshot the previous value
      const previousState = queryClient.getQueryData([
        "org",
        orgId,
        "onboarding",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<OnboardingState | undefined>(
        ["org", orgId, "onboarding"],
        (old) => ({
          ...(old ?? {
            currentStep: "ORGANIZATION" as const,
            formData: {
              name: "",
              plan: "free",
              addons: { prompts: false, experiments: false, evals: false },
              members: [],
            },
          }),
          ...newState,
        })
      );

      return { previousState };
    },
    // If mutation fails, roll back to the previous state
    onError: (err, newState, context) => {
      queryClient.setQueryData(
        ["org", orgId, "onboarding"],
        context?.previousState
      );
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries(["org", orgId, "onboarding"]);
    },
  });

  // Helper functions for common updates
  const setCurrentStep = (step: OnboardingState["currentStep"]) => {
    updateOnboarding({ currentStep: step });
  };

  const updateFormData = (formData: Partial<OnboardingState["formData"]>) => {
    updateOnboarding({
      formData: {
        ...(onboardingState?.formData ?? defaultFormData),
        ...formData,
      },
    });
  };

  return {
    onboardingState: onboardingState || defaultOnboardingState,
    setCurrentStep,
    updateFormData,
    updateOnboarding,
  };
};
