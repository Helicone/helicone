import { useOrg } from "@/components/layout/org/organizationContext";
import {
  ADDON_FEATURES,
  FeatureId,
  TierId,
  tierHasFeature,
} from "@/packages/common/features";
import { useMemo } from "react";

export const useHasAccess = (feature: FeatureId) => {
  const org = useOrg();

  return useMemo(() => {
    const tier = org?.currentOrg?.tier as TierId | undefined;
    const stripeMetadata = org?.currentOrg?.stripe_metadata as {
      addons?: { [key in (typeof ADDON_FEATURES)[number]]?: boolean };
    };

    if (!tier) return false;

    return tierHasFeature(tier, feature, stripeMetadata);
  }, [org?.currentOrg?.tier, org?.currentOrg?.stripe_metadata, feature]);
};
