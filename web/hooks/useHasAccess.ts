import { useOrg } from "@/components/layout/org/organizationContext";
import { useMemo } from "react";

export const useHasAccess = (
  feature: "evals" | "experiments" | "prompts" | "alerts"
) => {
  const org = useOrg();

  return useMemo(() => {
    const tier = org?.currentOrg?.tier;
    const stripeMetadata = org?.currentOrg?.stripe_metadata as {
      addons?: {
        evals?: boolean;
        experiments?: boolean;
        prompts?: boolean;
        alerts?: boolean;
      };
    };

    // Handle legacy tiers and team bundle
    if (
      tier === "growth" ||
      tier === "enterprise" ||
      tier === "pro" ||
      tier === "demo" ||
      tier === "team-20250130"
    ) {
      return true;
    }

    // Handle pro-20240913 tier with addons
    if (tier === "pro-20240913") {
      return stripeMetadata?.addons?.[feature] ?? false;
    }

    // Free tier
    return false;
  }, [org?.currentOrg?.tier, org?.currentOrg?.stripe_metadata, feature]);
};
