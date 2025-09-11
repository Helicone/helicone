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

function getPricingTier(
  pricing: ModelPricing[],
  inputTokens: number
): ModelPricing | null {
  if (!pricing || pricing.length === 0) return null;
  
  const sortedPricing = [...pricing].sort((a, b) => b.threshold - a.threshold);
  for (const tier of sortedPricing) {
    if (inputTokens >= tier.threshold) return tier;
  }
  return pricing[0];
}

export function calculateModelCostBreakdown(
  params: {
    modelUsage: ModelUsage;
    model: string;
    provider: ModelProviderName;
    requestCount?: number;
  }
): CostBreakdown | null {
  const { modelUsage, model, provider, requestCount = 1 } = params;

  const configResult = registry.getModelProviderConfig(model, provider);
  if (configResult.error || !configResult.data) return null;

  const config: ModelProviderConfig = configResult.data;

  const pricing = getPricingTier(config.pricing, modelUsage.input);
  if (!pricing) return null;

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

  breakdown.inputCost = modelUsage.input * pricing.input;
  
  if (modelUsage.cacheDetails) {
    if (modelUsage.cacheDetails.cachedInput > 0) {
      const cachedMultiplier = pricing.cacheMultipliers?.cachedInput ?? 1.0;
      breakdown.cachedInputCost = modelUsage.cacheDetails.cachedInput * pricing.input * cachedMultiplier;
    }

    if (modelUsage.cacheDetails.write5m) {
      const write5mMultiplier = pricing.cacheMultipliers?.write5m ?? 1.0;
      breakdown.cacheWrite5mCost = modelUsage.cacheDetails.write5m * pricing.input * write5mMultiplier;
    }

    if (modelUsage.cacheDetails.write1h) {
      const write1hMultiplier = pricing.cacheMultipliers?.write1h ?? 1.0;
      breakdown.cacheWrite1hCost = modelUsage.cacheDetails.write1h * pricing.input * write1hMultiplier;
    }
  }

  breakdown.outputCost = modelUsage.output * pricing.output;

  if (modelUsage.thinking) {
    const thinkingRate = pricing.thinking ?? pricing.output;
    breakdown.thinkingCost = modelUsage.thinking * thinkingRate;
  }

  if (modelUsage.audio) {
    const audioRate = pricing.audio ?? pricing.input;
    breakdown.audioCost = modelUsage.audio * audioRate;
  }

  if (modelUsage.video) {
    const videoRate = pricing.video ?? pricing.input;
    breakdown.videoCost = modelUsage.video * videoRate;
  }

  if (modelUsage.web_search && pricing.web_search) {
    breakdown.webSearchCost = modelUsage.web_search * pricing.web_search;
  }

  if (modelUsage.image && pricing.image) {
    breakdown.imageCost = modelUsage.image * pricing.image;
  }

  if (requestCount > 0 && pricing.request) {
    breakdown.requestCost = requestCount * pricing.request;
  }

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

  return breakdown;
}