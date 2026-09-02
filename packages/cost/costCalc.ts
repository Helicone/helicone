import { costOfPrompt } from "./index";
import type { ModelUsage } from "./usage/types";
import type { ModelProviderName } from "./models/providers";
import { calculateModelCostBreakdown, CostBreakdown } from "./models/calculate-cost";
import { registry } from "./models/registry";
import { heliconeProviderToModelProviderName } from "./models/provider-helpers";
import type { Provider } from "@helicone-package/llm-mapper/types";

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
  const cost = costOfPrompt({
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
  });

  if (cost === null) {
    warnIfUnpriced(params.provider, params.model);
    return 0;
  }

  return cost;
}

/**
 * Warn when a model has no pricing in the legacy cost table and none in the
 * model registry either. Callers prefer the registry result over the legacy
 * one, so a legacy miss on a model the registry prices is expected and stays
 * quiet; a miss in both is a request that will be recorded at $0.
 */
function warnIfUnpriced(provider: string, model: string): void {
  const modelProvider = heliconeProviderToModelProviderName(provider as Provider);
  if (modelProvider) {
    const registryResult = registry.getModelProviderConfigByProviderModelId(
      model,
      modelProvider
    );
    if (registryResult.data) {
      return;
    }
  }

  console.warn(
    `No pricing found for model "${model}" (provider "${provider}") in the legacy cost table or the model registry; recording cost as 0`
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
