import { costOfPrompt } from "./index";
import type { ModelUsage } from "./usage/types";
import type { ModelProviderName } from "./models/providers";
import { calculateModelCostBreakdown, CostBreakdown } from "./models/calculate-cost";

// since costs in clickhouse are multiplied by the multiplier
// divide to get real cost in USD in dollars
export const COST_PRECISION_MULTIPLIER = 1_000_000_000;

/**
 * LEGACY: Calculate model cost using the old cost registry format
 * This function uses the legacy cost registry in /providers/mappings
 * @deprecated Use modelCostFromRegistry for new implementations
 */
export function modelCost(
  params: {
    provider: string;
    model: string;
    sum_prompt_tokens: number;
    prompt_cache_write_tokens: number;
    prompt_cache_read_tokens: number;
    prompt_audio_tokens: number;
    sum_completion_tokens: number;
    completion_audio_tokens: number;
    prompt_cache_write_5m: number;
    prompt_cache_write_1h: number;
    per_call?: number;
    per_image?: number;
    multiple?: number;
  },
): number {
  return (
    costOfPrompt({
      provider: params.provider,
      model: params.model,
      promptTokens: params.sum_prompt_tokens,
      promptCacheWriteTokens: params.prompt_cache_write_tokens,
      promptCacheReadTokens: params.prompt_cache_read_tokens,
      promptAudioTokens: params.prompt_audio_tokens,
      completionTokens: params.sum_completion_tokens,
      completionAudioTokens: params.completion_audio_tokens,
      promptCacheWrite5m: params.prompt_cache_write_5m,
      promptCacheWrite1h: params.prompt_cache_write_1h,
      perCall: params.per_call,
      images: params.per_image,
      multiple: params.multiple,
    }) ?? 0
  );
}

export function modelCostBreakdownFromRegistry(params: {
  modelUsage: ModelUsage;
  provider: ModelProviderName;
  providerModelId: string;
  requestCount?: number;
}): CostBreakdown | null {
  const breakdown = calculateModelCostBreakdown({
    modelUsage: params.modelUsage,
    providerModelId: params.providerModelId,
    provider: params.provider,
    requestCount: params.requestCount,
  });
  
  return breakdown;
}
