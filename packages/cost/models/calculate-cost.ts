import type { ModelUsage, ModalityUsage } from "../usage/types";
import type { ModelProviderConfig, ModelPricing, ModalityPricing } from "./types";
import type { ModelProviderName } from "./providers";
import { registry } from "./registry";

export interface ModalityCostBreakdown {
  inputCost: number;
  cachedInputCost: number;
  outputCost: number;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cachedInputCost: number;
  cacheWrite5mCost: number;
  cacheWrite1hCost: number;
  thinkingCost: number;

  // Per-modality cost breakdown
  image?: ModalityCostBreakdown;
  audio?: ModalityCostBreakdown;
  video?: ModalityCostBreakdown;
  file?: ModalityCostBreakdown;

  webSearchCost: number;
  requestCost: number;
  totalCost: number;
}

export type CostBreakdownField = keyof CostBreakdown;

function getValueAtPath(obj: any, path: string[]): any {
  let curr = obj;
  for (const key of path) {
    if (curr == null) return undefined;
    curr = curr[key];
  }
  return curr;
}

function fillFromPrevious<T extends object>(
  allObjects: T[],
  index: number
): T {
  const result = structuredClone(allObjects[index]); // deep copy

  function fillRecursive(target: any, i: number, path: string[]) {
    // Collect all keys that exist in any previous tier at this path
    const allKeysSet = new Set<string>(Object.keys(target));
    for (let j = i - 1; j >= 0; j--) {
      const prevValue = getValueAtPath(allObjects[j], path);
      if (prevValue && typeof prevValue === "object" && !Array.isArray(prevValue)) {
        Object.keys(prevValue).forEach(k => allKeysSet.add(k));
      }
    }

    const allKeys = Array.from(allKeysSet);
    for (const key of allKeys) {
      const value = target[key];

      // If the field is an object, recurse
      if (value && typeof value === "object" && !Array.isArray(value)) {
        fillRecursive(value, i, path.concat(key));
        continue;
      }

      // Skip already defined values
      if (value !== undefined) continue;

      // Field is undefined → search backwards
      for (let j = i - 1; j >= 0; j--) {
        // Walk to the same path to get candidate value
        const candidate = getValueAtPath(allObjects[j], path.concat(key));
        if (candidate !== undefined) {
          target[key] = candidate;
          break;
        }
      }
    }
  }

  fillRecursive(result, index, []);

  return result;
}

/**
 * Preprocesses pricing tiers by filling missing fields from previous tiers.
 * This should be called once upfront to avoid repeated filling on every lookup.
 */
function preprocessPricingTiers(sortedPricing: ModelPricing[]): ModelPricing[] {
  return sortedPricing.map((_, index) => fillFromPrevious(sortedPricing, index));
}

// given a preprocessed array of pricing tiers (thresholds ascending) and a value
// return the pricing tier that matches the highest threshold the value meets
function getPricingTier(
  preprocessedPricing: ModelPricing[],
  value: number,
): ModelPricing {
  let matchedTierIndex = 0;
  // Find the highest threshold that the value meets
  for (let i = 0; i < preprocessedPricing.length; i++) {
    if (value >= preprocessedPricing[i].threshold) {
      matchedTierIndex = i;
      // Don't break - continue to find the highest matching threshold
    }
  }

  return preprocessedPricing[matchedTierIndex];
}

function getThresholdValueFunction(provider: ModelProviderName): (usage: ModelUsage, field: CostBreakdownField) => number {
  switch (provider) {
    case "vertex":
      return (usage: ModelUsage, field: CostBreakdownField) => {
        switch (field) {
          case "inputCost":
          case "outputCost":
            return usage.input;
          case "cachedInputCost":
            return usage.cacheDetails?.cachedInput ?? 0;
          default:
            return 0;
        } 
      };
    case "google-ai-studio":
      return (usage: ModelUsage, field: CostBreakdownField) => {
        switch (field) {
          case "inputCost":
          case "outputCost":
          case "cachedInputCost":
            // total prompt length
            return usage.input + (usage.cacheDetails?.cachedInput ?? 0);
          default:
            return 0;
        }
      }
    case "anthropic":
      return (usage: ModelUsage, field: CostBreakdownField) => {
        switch (field) {
          case "inputCost":
          case "outputCost":
            return usage.input + 
              (usage.cacheDetails?.cachedInput ?? 0) + 
              (usage.cacheDetails?.write5m ?? 0) + 
              (usage.cacheDetails?.write1h ?? 0);
          default:
            return 0;
        }
      }
    case "xai":
      return (usage: ModelUsage, field: CostBreakdownField) => {
        switch (field) {
          case "inputCost":
          case "outputCost":
          case "cachedInputCost":
            return usage.input + (usage.cacheDetails?.cachedInput ?? 0);
          default:
            return 0;
        }
      }
    default:
      return () => 0;
  }
}

export function calculateModelCostBreakdown(params: {
  modelUsage: ModelUsage;
  providerModelId: string;
  provider: ModelProviderName;
  requestCount?: number;
}): CostBreakdown | null {
  const { modelUsage, providerModelId, provider, requestCount = 1 } = params;

  const configResult = registry.getModelProviderConfigByProviderModelId(
    providerModelId,
    provider,
  );
  if (configResult.error || !configResult.data) return null;

  const config: ModelProviderConfig = configResult.data;

  // Get a function that, given usage and the cost type we are calculating, return the value we compare against threshold.
  // e.g Anthropic's inputCost and output cost is higher if PROMPT >= X tokens
  // e.g Vertex's inputCost is higher if INPUT >= X tokens, but cachedInputCost is higher if CACHED_INPUT >= X tokens
  // getThresholdValue is a function that will return the value to compare to X
  const getThresholdValue = getThresholdValueFunction(provider);
  const sortedPricing = [...config.pricing].sort((a, b) => a.threshold - b.threshold);
  // Preprocess pricing tiers once upfront to fill missing fields from previous tiers
  const preprocessedPricing = preprocessPricingTiers(sortedPricing);
  const basePricing = preprocessedPricing[0];

  const breakdown: CostBreakdown = {
    inputCost: 0,
    outputCost: 0,
    cachedInputCost: 0,
    cacheWrite5mCost: 0,
    cacheWrite1hCost: 0,
    thinkingCost: 0,
    webSearchCost: 0,
    requestCost: 0,
    totalCost: 0,
  };

  const inputPricing = getPricingTier(preprocessedPricing, getThresholdValue(modelUsage, "inputCost"));
  breakdown.inputCost = modelUsage.input * inputPricing.input;

  if (modelUsage.cacheDetails) {
    if (modelUsage.cacheDetails.cachedInput > 0) {
      const cachedInputPricing = getPricingTier(preprocessedPricing, getThresholdValue(modelUsage, "cachedInputCost"));
      const cachedMultiplier = cachedInputPricing.cacheMultipliers?.cachedInput ?? 1.0;
      breakdown.cachedInputCost =
        modelUsage.cacheDetails.cachedInput * cachedInputPricing.input * cachedMultiplier;
    }

    if (modelUsage.cacheDetails.write5m) {
      const write5mMultiplier = basePricing.cacheMultipliers?.write5m ?? 1.0;
      breakdown.cacheWrite5mCost =
        modelUsage.cacheDetails.write5m * basePricing.input * write5mMultiplier;
    }

    if (modelUsage.cacheDetails.write1h) {
      const write1hMultiplier = basePricing.cacheMultipliers?.write1h ?? 1.0;
      breakdown.cacheWrite1hCost =
        modelUsage.cacheDetails.write1h * basePricing.input * write1hMultiplier;
    }
  }

  const outputPricing = getPricingTier(preprocessedPricing, getThresholdValue(modelUsage, "outputCost"));
  breakdown.outputCost = modelUsage.output * outputPricing.output;

  if (modelUsage.thinking) {
    const thinkingRate = basePricing.thinking ?? basePricing.output;
    breakdown.thinkingCost = modelUsage.thinking * thinkingRate;
  }

  // Calculate per-modality costs
  const modalities = ['image', 'audio', 'video', 'file'] as const;
  for (const modality of modalities) {
    const modalityUsage = modelUsage[modality];
    const modalityPricing = basePricing[modality];

    if (modalityUsage && hasModalityTokens(modalityUsage)) {
      breakdown[modality] = calculateModalityCost(
        modalityUsage,
        modalityPricing,
        basePricing
      );
    }
  }

  if (modelUsage.web_search && basePricing.web_search) {
    breakdown.webSearchCost = modelUsage.web_search * basePricing.web_search;
  }

  if (requestCount > 0 && basePricing.request) {
    breakdown.requestCost = requestCount * basePricing.request;
  }

  if (modelUsage.cost) {
    breakdown.totalCost = modelUsage.cost;
  } else {
    // Sum up all costs including modality costs
    const modalityTotalCost = modalities.reduce((sum, modality) => {
      const modalityCosts = breakdown[modality];
      if (modalityCosts) {
        return sum + modalityCosts.inputCost + modalityCosts.cachedInputCost + modalityCosts.outputCost;
      }
      return sum;
    }, 0);

    breakdown.totalCost =
      breakdown.inputCost +
      breakdown.outputCost +
      breakdown.cachedInputCost +
      breakdown.cacheWrite5mCost +
      breakdown.cacheWrite1hCost +
      breakdown.thinkingCost +
      modalityTotalCost +
      breakdown.webSearchCost +
      breakdown.requestCost;
  }

  return breakdown;
}

function hasModalityTokens(usage: ModalityUsage): boolean {
  return (usage.input ?? 0) > 0 || (usage.cachedInput ?? 0) > 0 || (usage.output ?? 0) > 0;
}

/**
 * Calculate costs for a single modality (image, audio, video, file).
 * Uses fallback logic when specific modality pricing is not defined.
 */
function calculateModalityCost(
  modalityUsage: ModalityUsage,
  modalityPricing: ModalityPricing | undefined,
  basePricing: ModelPricing
): ModalityCostBreakdown {
  // Input rate fallback: modality.input -> text input
  const inputRate = modalityPricing?.input ?? basePricing.input;

  // Cached multiplier fallback: modality.cachedInputMultiplier -> text cacheMultipliers.cachedInput -> 1.0
  const cachedMultiplier =
    modalityPricing?.cachedInputMultiplier ??
    basePricing.cacheMultipliers?.cachedInput ??
    1.0;

  // Output rate fallback: modality.output -> text output
  const outputRate = modalityPricing?.output ?? basePricing.output;

  return {
    inputCost: (modalityUsage.input ?? 0) * inputRate,
    cachedInputCost: (modalityUsage.cachedInput ?? 0) * inputRate * cachedMultiplier,
    outputCost: (modalityUsage.output ?? 0) * outputRate,
  };
}
