import { useOrg } from "@/components/layout/org/organizationContext";
import { ADDON_FEATURES, FeatureId, NON_FREE_FEATURES } from "@/lib/features";
import { useMemo } from "react";

export const useHasAccess = (feature: FeatureId) => {
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

    // Grandfather in evals and experiments only for old pro tier if they have prompts access
    if (
      tier === "pro-20240913" &&
      (feature === "evals" || feature === "experiments") &&
      stripeMetadata?.addons?.["prompts"]
    ) {
      return true;
    }

    if (
      tier === "pro-20240913" ||
      tier === "pro-20250202" ||
      tier === "team-20250130"
    ) {
      return (
        stripeMetadata?.addons?.[feature as (typeof ADDON_FEATURES)[number]] ??
        false
      );
    }

    // Free tier
    return false;
  }, [org?.currentOrg?.tier, org?.currentOrg?.stripe_metadata, feature]);
};
