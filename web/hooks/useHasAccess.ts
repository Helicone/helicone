import { useOrg } from "@/components/layout/org/organizationContext";
import { useMemo } from "react";

const ADDON_FEATURES = ["evals", "experiments", "prompts", "alerts"] as const;
const NON_FREE_FEATURES = ["sessions"] as const;

export const useHasAccess = (
  feature: (typeof ADDON_FEATURES)[number] | (typeof NON_FREE_FEATURES)[number]
) => {
  const org = useOrg();

  return useMemo(() => {
    const tier = org?.currentOrg?.tier;
    const stripeMetadata = org?.currentOrg?.stripe_metadata as {
      addons?: { [key in (typeof ADDON_FEATURES)[number]]?: boolean };
    };

    // Handle non-free features first
    if (NON_FREE_FEATURES.includes(feature as any)) {
      return tier !== "free";
    }

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

    // Handle pro-20240913 tier with addons (ONLY addon features reach here)
    if (tier === "pro-20240913" || tier === "pro-20250202") {
      return (
        stripeMetadata?.addons?.[feature as (typeof ADDON_FEATURES)[number]] ??
        false
      );
    }

    // Free tier
    return false;
  }, [org?.currentOrg?.tier, org?.currentOrg?.stripe_metadata, feature]);
};
