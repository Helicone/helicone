import { useOrg } from "@/components/layout/org/organizationContext";
import { useMemo } from "react";

const ADDON_FEATURES = ["evals", "experiments", "prompts"] as const;
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

    if (tier === "pro-20240913" || tier === "pro-20250202") {
      // Grandfather in evals and experiments only for old pro tier if they have prompts access
      if (
        tier === "pro-20240913" &&
        (feature === "evals" || feature === "experiments")
      ) {
        return stripeMetadata?.addons?.["prompts"] ?? false;
      }
      return (
        stripeMetadata?.addons?.[feature as (typeof ADDON_FEATURES)[number]] ??
        false
      );
    }

    // Free tier
    return false;
  }, [org?.currentOrg?.tier, org?.currentOrg?.stripe_metadata, feature]);
};
