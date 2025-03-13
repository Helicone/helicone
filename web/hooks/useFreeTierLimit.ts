import { useOrg } from "@/components/layout/org/organizationContext";
import { useHasAccess } from "@/hooks/useHasAccess";
import {
  FREE_TIER_CONFIG,
  FreeTierLimitContext,
  LimitConfig,
} from "@/lib/freeTierLimits";
import { FeatureId, SubfeatureId } from "@/lib/features";

// Define return type interfaces
export interface FeatureLimitResult {
  // Whether the user can create more items (has access or below limit)
  canCreate: boolean;

  // Whether the user has full access to this feature (e.g., via paid plan)
  hasFullAccess: boolean;

  // How many more items the user can create
  remainingItems: number;

  // The feature configuration from FREE_TIER_CONFIG
  featureConfig: LimitConfig | null;

  // Message to show when prompting for upgrade
  upgradeMessage: string;

  // The maximum number of items allowed on the free tier
  freeLimit: number;
}

export interface SubfeatureLimitResult {
  // Whether the user can create more subfeature items
  canCreate: boolean;

  // Whether the user has full access to the parent feature
  hasFullAccess: boolean;

  // How many more items the user can create
  remainingItems: number;

  // The subfeature configuration from FREE_TIER_CONFIG
  subfeatureConfig: LimitConfig | null;

  // Message to show when prompting for upgrade
  upgradeMessage: string;

  // The maximum number of items allowed on the free tier
  freeLimit: number;
}

// Helper to create context object
function getContext(): FreeTierLimitContext {
  const org = useOrg();

  return {
    organization: org?.currentOrg,
    userId: org?.currentOrg?.owner,
  };
}

export function useFeatureLimit(
  feature: FeatureId,
  itemCount: number
): FeatureLimitResult {
  // Get required data
  const hasFullAccess = useHasAccess(feature);
  const context = getContext();

  // Get the feature configuration
  const featureConfig = FREE_TIER_CONFIG.features[feature]?.main;

  // If no config exists, allow unlimited
  if (!featureConfig) {
    return {
      canCreate: true,
      hasFullAccess,
      remainingItems: Infinity,
      featureConfig: null,
      upgradeMessage: "",
      freeLimit: Infinity,
    };
  }

  // Calculate the limit based on context
  const freeLimit = featureConfig.getLimit(context);

  // Check if limit is reached
  const canCreate = !hasFullAccess && itemCount >= freeLimit;
  const remainingItems = Math.max(0, freeLimit - itemCount);

  // Generate upgrade message
  const upgradeMessage =
    featureConfig.upgradeMessage?.(freeLimit, itemCount) ??
    `Upgrade for unlimited access.`;

  return {
    canCreate,
    hasFullAccess,
    remainingItems,
    featureConfig,
    upgradeMessage,
    freeLimit,
  };
}

// Hook for subfeature limits
export function useSubfeatureLimit(
  feature: FeatureId,
  subfeature: SubfeatureId,
  itemCount: number
): SubfeatureLimitResult {
  // Get required data
  const hasFullAccess = useHasAccess(feature);
  const context = getContext();

  // Get the subfeature configuration if it exists
  const subfeatureConfig =
    FREE_TIER_CONFIG.features[feature]?.subfeatures?.[subfeature];

  // If no config exists, allow unlimited
  if (!subfeatureConfig) {
    return {
      canCreate: true,
      hasFullAccess,
      remainingItems: Infinity,
      subfeatureConfig: null,
      upgradeMessage: "",
      freeLimit: Infinity,
    };
  }

  // Calculate the limit based on context
  const freeLimit = subfeatureConfig.getLimit(context);

  // Check if limit is reached
  const hasReachedLimit = !hasFullAccess && itemCount >= freeLimit;
  const remainingItems = Math.max(0, freeLimit - itemCount);
  const canCreate = hasFullAccess || !hasReachedLimit;

  // Generate upgrade message
  const upgradeMessage =
    subfeatureConfig.upgradeMessage?.(freeLimit, itemCount) ??
    `Upgrade for unlimited access.`;

  return {
    canCreate,
    hasFullAccess,
    remainingItems,
    subfeatureConfig,
    upgradeMessage,
    freeLimit,
  };
}
