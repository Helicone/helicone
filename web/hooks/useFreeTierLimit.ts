import { useHasAccess } from "@/hooks/useHasAccess";
import { FREE_TIER_CONFIG, LimitConfig } from "@/lib/freeTierLimits";
import { FeatureId, SubfeatureId } from "@/lib/features";

export interface BaseLimitResult {
  hasAccess: boolean;
  remainingItems: number;
  upgradeMessage: string;
  freeLimit: number;
  canCreate: boolean;
}

export interface FeatureLimitResult extends BaseLimitResult {
  featureConfig: LimitConfig | null;
}

export interface SubfeatureLimitResult extends BaseLimitResult {
  subfeatureConfig: LimitConfig | null;
}

export type LimitResult = FeatureLimitResult | SubfeatureLimitResult;

export function useFeatureLimit(
  feature: FeatureId,
  itemCount: number,
  subfeature?: SubfeatureId | undefined,
): LimitResult {
  const hasAccess = useHasAccess(feature);
  let config: LimitConfig | null = null;

  if (subfeature) {
    config =
      FREE_TIER_CONFIG.features[feature]?.subfeatures?.[subfeature] ?? null;
  } else {
    config = FREE_TIER_CONFIG.features[feature]?.main ?? null;
  }

  if (!config) {
    const baseResult = {
      hasAccess,
      remainingItems: Infinity,
      upgradeMessage: "",
      freeLimit: Infinity,
      canCreate: true,
    };

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

  const freeLimit = config.getLimit();
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
