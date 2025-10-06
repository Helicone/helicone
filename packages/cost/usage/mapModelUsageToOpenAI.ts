import { ModelUsage } from "./types";
import { OpenAIUsage } from "@helicone-package/llm-mapper/transform/types/common";

/**
 * Converts normalized ModelUsage to OpenAI usage format
 * Used by AI Gateway to normalize usage from all providers to OpenAI format
 */
export function mapModelUsageToOpenAI(modelUsage: ModelUsage): OpenAIUsage {
  const promptTokens =
    modelUsage.input + (modelUsage.cacheDetails?.cachedInput ?? 0);
  const completionTokens = modelUsage.output + (modelUsage.thinking ?? 0);

  const usage: OpenAIUsage = {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
  };

  // Map cache details if present
  if (modelUsage.cacheDetails) {
    const { cachedInput, write5m, write1h } = modelUsage.cacheDetails;

    usage.prompt_tokens_details = {
      cached_tokens: cachedInput ?? 0,
      audio_tokens: modelUsage.audio ?? 0,
    };

    // Add cache write details if present
    if (write5m || write1h) {
      usage.prompt_tokens_details.cache_write_tokens =
        (write5m ?? 0) + (write1h ?? 0);
      usage.prompt_tokens_details.cache_write_details = {
        write_5m_tokens: write5m ?? 0,
        write_1h_tokens: write1h ?? 0,
      };
    }
  } else if (modelUsage.audio) {
    // Audio tokens without cache details
    usage.prompt_tokens_details = {
      cached_tokens: 0,
      audio_tokens: modelUsage.audio,
    };
  }

  // Map completion token details
  const hasCompletionDetails = modelUsage.thinking || modelUsage.audio;
  if (hasCompletionDetails) {
    usage.completion_tokens_details = {
      reasoning_tokens: modelUsage.thinking ?? 0,
      audio_tokens: modelUsage.audio ?? 0,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0,
    };
  }

  // Map web search to server_tool_use (Anthropic-style extension to OpenAI format)
  if (modelUsage.web_search && modelUsage.web_search > 0) {
    // Add as an extension to OpenAI format - this allows downstream processors to extract it
    (usage as any).server_tool_use = {
      web_search_requests: modelUsage.web_search,
    };
  }

  return usage;
}
