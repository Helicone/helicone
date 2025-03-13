import { useOrg } from "@/components/layout/org/organizationContext";
import { useHasAccess } from "@/hooks/useHasAccess";
import {
  FREE_TIER_CONFIG,
  FreeTierLimitContext,
  LimitConfig,
} from "@/lib/freeTierLimits";
import { FeatureId, SubfeatureId } from "@/lib/features";

// Define base interface for all limit results
export interface BaseLimitResult {
  // Whether the user has access to this feature (via paid plan)
  hasAccess: boolean;
  // How many more items the user can create
  remainingItems: number;

  // Message to show when prompting for upgrade
  upgradeMessage: string;

  // The maximum number of items allowed on the free tier
  freeLimit: number;

  // Whether the user can create more items
  canCreate: boolean;
}

export interface FeatureLimitResult extends BaseLimitResult {
  featureConfig: LimitConfig | null;
}

export interface SubfeatureLimitResult extends BaseLimitResult {
  subfeatureConfig: LimitConfig | null;
}

// Union type for both result types
export type LimitResult = FeatureLimitResult | SubfeatureLimitResult;

// Helper to create context object
function getContext(): FreeTierLimitContext {
  const org = useOrg();

  return {
    organization: org?.currentOrg,
    userId: org?.currentOrg?.owner,
  };
}

/**
 * Unified hook for checking feature and subfeature limits
 * @param feature The feature ID to check access for
 * @param itemCount Number of items using this feature
 * @param subfeature Optional subfeature ID (if checking a subfeature)
 * @returns Limit information including access status and remaining items
 */
export function useFeatureLimit(
  feature: FeatureId,
  itemCount: number,
  subfeature?: SubfeatureId | undefined
): LimitResult {
  // Get required data
  const hasAccess = useHasAccess(feature);
  const context = getContext();

  let config: LimitConfig | null = null;

  // Determine if we're checking a feature or subfeature
  if (subfeature) {
    config =
      FREE_TIER_CONFIG.features[feature]?.subfeatures?.[subfeature] ?? null;
  } else {
    config = FREE_TIER_CONFIG.features[feature]?.main ?? null;
  }

  // If no config exists, allow unlimited
  if (!config) {
    const baseResult = {
      hasAccess,
      remainingItems: Infinity,
      upgradeMessage: "",
      freeLimit: Infinity,
      canCreate: true,
    };

    // Return appropriate type based on if subfeature was provided
    if (subfeature) {
      return {
        ...baseResult,
        subfeatureConfig: null,
      } as SubfeatureLimitResult;
    } else {
      return {
        ...baseResult,
        featureConfig: null,
      } as FeatureLimitResult;
    }
  }

  const freeLimit = config.getLimit(context);
  const canCreate = hasAccess || itemCount < freeLimit;
  const remainingItems = Math.max(0, freeLimit - itemCount);

  const upgradeMessage =
    config.upgradeMessage?.(freeLimit, itemCount) ??
    `Upgrade for unlimited access.`;

  const baseResult = {
    hasAccess,
    remainingItems,
    upgradeMessage,
    freeLimit,
    canCreate,
  };

  if (subfeature) {
    return {
      ...baseResult,
      subfeatureConfig: config,
    } as SubfeatureLimitResult;
  } else {
    return {
      ...baseResult,
      featureConfig: config,
    } as FeatureLimitResult;
  }
}
