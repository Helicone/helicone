import { useOrg } from "@/components/layout/org/organizationContext";
import { CONTACT_US_URL } from "@/components/templates/pricing/contactCTA";

/**
 * Self-serve plan upgrades and add-on trials have been removed. Confirming a
 * trial now routes the user to the contact page instead of starting a Stripe
 * checkout.
 */
export const useFeatureTrial = (
  _productType: "prompts" | "experiments" | "evals",
  _featureName: string,
) => {
  const org = useOrg();

  const proRequired =
    org?.currentOrg?.tier === "free" || org?.currentOrg?.tier === "growth";

  const handleConfirmTrial = async (_selectedPlan?: string) => {
    window.open(CONTACT_US_URL, "_blank");
    return { success: true, requiresRedirect: true };
  };

  return {
    handleConfirmTrial,
    proRequired,
  };
};
