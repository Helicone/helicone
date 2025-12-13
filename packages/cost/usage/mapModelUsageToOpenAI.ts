import { ModelUsage, ModalityUsage } from "./types";
import { OpenAIUsage, ModalityTokenDetails } from "@helicone-package/llm-mapper/transform/types/common";

function mapModalityUsageToTokenDetails(usage: ModalityUsage): ModalityTokenDetails {
  return {
    input_tokens: usage.input ?? 0,
    cached_tokens: usage.cachedInput ?? 0,
    output_tokens: usage.output ?? 0,
  };
}

function hasModalityTokens(usage: ModalityUsage | undefined): boolean {
  if (!usage) return false;
  return (usage.input ?? 0) > 0 || (usage.cachedInput ?? 0) > 0 || (usage.output ?? 0) > 0;
}

function sumModalityTokens(usage: ModalityUsage | undefined): number {
  if (!usage) return 0;
  return (usage.input ?? 0) + (usage.cachedInput ?? 0) + (usage.output ?? 0);
}

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

  const audioInputTokens = modelUsage.audio?.input ?? 0;
  const audioOutputTokens = modelUsage.audio?.output ?? 0;
  // Map cache details if present
  if (modelUsage.cacheDetails) {
    const { cachedInput, write5m, write1h } = modelUsage.cacheDetails;
    usage.total_tokens += cachedInput;

    usage.prompt_tokens_details = {
      cached_tokens: cachedInput ?? 0,
      audio_tokens: audioInputTokens,
    };

    // Add cache write details if present
    if (write5m || write1h) {
      usage.prompt_tokens_details.cache_write_tokens =
        (write5m ?? 0) + (write1h ?? 0);
      usage.prompt_tokens_details.cache_write_details = {
        write_5m_tokens: write5m ?? 0,
        write_1h_tokens: write1h ?? 0,
      };

      usage.total_tokens += (write5m ?? 0) + (write1h ?? 0);
    }
  } else if (audioInputTokens > 0) {
    // Modality tokens without cache details
    usage.prompt_tokens_details = {
      cached_tokens: 0,
      audio_tokens: audioInputTokens,
    };
  }

  // Map completion token details
  const hasCompletionDetails = modelUsage.thinking || audioOutputTokens > 0;
  if (hasCompletionDetails) {
    usage.completion_tokens_details = {
      reasoning_tokens: modelUsage.thinking ?? 0,

      audio_tokens: audioOutputTokens,
      accepted_prediction_tokens: 0,
      rejected_prediction_tokens: 0,
    };
  }

  usage.modality_tokens = {};

  if (hasModalityTokens(modelUsage.image)) {
    usage.modality_tokens.image = mapModalityUsageToTokenDetails(modelUsage.image!);
  }
  if (hasModalityTokens(modelUsage.audio)) {
    usage.modality_tokens.audio = mapModalityUsageToTokenDetails(modelUsage.audio!);
  }
  if (hasModalityTokens(modelUsage.video)) {
    usage.modality_tokens.video = mapModalityUsageToTokenDetails(modelUsage.video!);
  }
  if (hasModalityTokens(modelUsage.file)) {
    usage.modality_tokens.file = mapModalityUsageToTokenDetails(modelUsage.file!);
  }

  usage.total_tokens +=
    sumModalityTokens(modelUsage.image) +
    sumModalityTokens(modelUsage.audio) +
    sumModalityTokens(modelUsage.video) +
    sumModalityTokens(modelUsage.file);

  // Map web search to server_tool_use (Anthropic-style extension to OpenAI format)
  if (modelUsage.web_search && modelUsage.web_search > 0) {
    // Add as an extension to OpenAI format - this allows downstream processors to extract it
    (usage as any).server_tool_use = {
      web_search_requests: modelUsage.web_search,
    };
  }

  // Add cost if present
  if (modelUsage.cost) {
    usage.cost = modelUsage.cost;
  }

  return usage;
}
