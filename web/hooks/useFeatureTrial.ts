import { useMutation, useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";
import useNotification from "@/components/shared/notification/useNotification";

export const useFeatureTrial = (
  productType: "prompts" | "experiments" | "evals",
  featureName: string,
) => {
  const org = useOrg();
  const notification = useNotification();

  const subscription = useQuery({
    queryKey: ["subscription", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      return jawn.GET("/v1/stripe/subscription");
    },
  });

  const mutation = useMutation({
    mutationFn: async (selectedPlan?: string) => {
      const isTeamBundle = selectedPlan === "Team Bundle";
      const jawn = getJawnClient(org?.currentOrg?.id);

      // Handle Team Bundle selection
      if (isTeamBundle) {
        const endpoint =
          subscription.data?.data?.status === "canceled" ||
          org?.currentOrg?.tier === "pro-20240913" ||
          org?.currentOrg?.tier === "pro-20250202"
            ? "/v1/stripe/subscription/existing-customer/upgrade-to-team-bundle"
            : "/v1/stripe/subscription/new-customer/upgrade-to-team-bundle";

        const { data } = await jawn.POST(endpoint);
        return { type: "redirect" as const, url: data };
      }

      // Existing logic for individual addons
      if (proRequired) {
        const endpoint =
          subscription.data?.data?.status === "canceled"
            ? "/v1/stripe/subscription/existing-customer/upgrade-to-pro"
            : "/v1/stripe/subscription/new-customer/upgrade-to-pro";

        const { data } = await jawn.POST(endpoint, {
          body: {
            addons: {
              [productType]: true,
            },
          },
        });

        return { type: "redirect" as const, url: data };
      }

      await jawn.POST(`/v1/stripe/subscription/add-ons/{productType}`, {
        params: { path: { productType } },
      });

      return { type: "refresh" as const };
    },
  });

  const handleConfirmTrial = async (selectedPlan?: string) => {
    try {
      const result = await mutation.mutateAsync(selectedPlan);

      if (result.type === "redirect") {
        window.open(result.url, "_blank");
        return { success: true, requiresRedirect: true };
      }

      notification.setNotification(
        `${featureName} trial has been added!`,
        "success",
      );
      await subscription.refetch();
      window.location.reload();
      return { success: true };
    } catch (error) {
      notification.setNotification(
        `Failed to start ${featureName} trial. Please try again or contact support.`,
        "error",
      );
      return { success: false };
    }
  };

  const proRequired =
    org?.currentOrg?.tier === "free" || org?.currentOrg?.tier === "growth";

  return {
    handleConfirmTrial,
    proRequired,
    mutation,
    subscription,
  };
};
