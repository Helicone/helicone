import type { ModelUsage } from "../usage/types";
import type { ModelProviderConfig, ModelPricing } from "./types";
import type { ModelProviderName } from "./providers";
import { registry } from "./registry";

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  cachedInputCost: number;
  cacheWrite5mCost: number;
  cacheWrite1hCost: number;
  thinkingCost: number;
  audioCost: number;
  videoCost: number;
  webSearchCost: number;
  imageCost: number;
  requestCost: number;
  totalCost: number;
}

export type CostBreakdownField = keyof CostBreakdown;

function getPricingTier(
  sortedPricing: ModelPricing[],
  value: number,
): ModelPricing {
  for (const tier of sortedPricing) {
    if (value >= tier.threshold) {
      return tier;
    }
  }
  return sortedPricing[0];
}

function getThresholdValueFunction(provider: ModelProviderName) {
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
    default:
      return (usage: ModelUsage, field: CostBreakdownField) => 0;
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
  const sortedPricing = [...config.pricing].sort((a, b) => b.threshold - a.threshold);
  const basePricing = sortedPricing[0];

  const breakdown: CostBreakdown = {
    inputCost: 0,
    outputCost: 0,
    cachedInputCost: 0,
    cacheWrite5mCost: 0,
    cacheWrite1hCost: 0,
    thinkingCost: 0,
    audioCost: 0,
    videoCost: 0,
    webSearchCost: 0,
    imageCost: 0,
    requestCost: 0,
    totalCost: 0,
  };

  const inputPricing = getPricingTier(sortedPricing, getThresholdValue(modelUsage, "inputCost"));
  breakdown.inputCost = modelUsage.input * inputPricing.input;

  if (modelUsage.cacheDetails) {
    if (modelUsage.cacheDetails.cachedInput > 0) {
      const cachedInputPricing = getPricingTier(sortedPricing, getThresholdValue(modelUsage, "cachedInputCost"));
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

  const outputPricing = getPricingTier(sortedPricing, getThresholdValue(modelUsage, "outputCost"));
  breakdown.outputCost = modelUsage.output * outputPricing.output;

  if (modelUsage.thinking) {
    const thinkingRate = basePricing.thinking ?? basePricing.output;
    breakdown.thinkingCost = modelUsage.thinking * thinkingRate;
  }

  if (modelUsage.audio) {
    const audioRate = basePricing.audio ?? inputPricing.input;
    breakdown.audioCost = modelUsage.audio * audioRate;
  }

  if (modelUsage.video) {
    const videoRate = basePricing.video ?? basePricing.input;
    breakdown.videoCost = modelUsage.video * videoRate;
  }

  if (modelUsage.web_search && basePricing.web_search) {
    breakdown.webSearchCost = modelUsage.web_search * basePricing.web_search;
  }

  if (modelUsage.image && basePricing.image) {
    breakdown.imageCost = modelUsage.image * basePricing.image;
  }

  if (requestCount > 0 && basePricing.request) {
    breakdown.requestCost = requestCount * basePricing.request;
  }

  if (modelUsage.cost) {
    breakdown.totalCost = modelUsage.cost;
  } else {
    breakdown.totalCost =
      breakdown.inputCost +
      breakdown.outputCost +
      breakdown.cachedInputCost +
      breakdown.cacheWrite5mCost +
      breakdown.cacheWrite1hCost +
      breakdown.thinkingCost +
      breakdown.audioCost +
      breakdown.videoCost +
      breakdown.webSearchCost +
      breakdown.imageCost +
      breakdown.requestCost;
  }

  return breakdown;
}
