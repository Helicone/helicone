import { OpenAIUsageProcessor } from "./openAIUsageProcessor";
import { ModelUsage } from "./types";

export class DeepSeekUsageProcessor extends OpenAIUsageProcessor {
  protected extractUsageFromResponse(parsedResponse: any): ModelUsage {
    if (!parsedResponse || typeof parsedResponse !== "object") {
      return {
        input: 0,
        output: 0,
      };
    }

    const usage = parsedResponse.usage || {};

    // DeepSeek uses different field names for cache tracking
    const promptCacheHitTokens = usage.prompt_cache_hit_tokens ?? 0;
    const promptCacheMissTokens = usage.prompt_cache_miss_tokens ?? 0;
    const completionTokens =
      usage.completion_tokens ?? usage.output_tokens ?? 0;

    // Extract reasoning tokens if present (for deepseek-reasoner)
    const completionDetails = usage.completion_tokens_details || {};
    const reasoningTokens = completionDetails.reasoning_tokens ?? 0;

    // For DeepSeek:
    // - prompt_tokens = prompt_cache_hit_tokens + prompt_cache_miss_tokens
    // - The non-cached input is prompt_cache_miss_tokens
    // - The cached input is prompt_cache_hit_tokens
    // - completion_tokens includes reasoning_tokens, so we subtract them to get actual output
    const effectivePromptTokens = promptCacheMissTokens;
    const effectiveCompletionTokens = Math.max(
      0,
      completionTokens - reasoningTokens
    );

    const modelUsage: ModelUsage = {
      input: effectivePromptTokens,
      output: effectiveCompletionTokens,
    };

    // Add cache details if there are cached tokens
    if (promptCacheHitTokens > 0) {
      modelUsage.cacheDetails = {
        cachedInput: promptCacheHitTokens,
      };
    }

    // Add reasoning/thinking tokens if present
    if (reasoningTokens > 0) {
      modelUsage.thinking = reasoningTokens;
    }

    return modelUsage;
  }
}
