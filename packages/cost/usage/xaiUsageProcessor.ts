import { OpenAIUsageProcessor } from "./openAIUsageProcessor";
import { ModelUsage } from "./types";

export class XAIUsageProcessor extends OpenAIUsageProcessor {
  // XAI reports completion_tokens and prompt_tokens without including reasoning or audio
  // so they are already "effective" tokens - we don't subtract reasoning/audio from them
  protected extractUsageFromResponse(parsedResponse: any): ModelUsage {
    if (!parsedResponse || typeof parsedResponse !== "object") {
      return {
        input: 0,
        output: 0,
      };
    }

    const usage = parsedResponse.usage || {};

    const completionTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;

    const promptDetails = usage.prompt_tokens_details || usage.input_tokens_details || {};
    const completionDetails = usage.completion_tokens_details || usage.output_tokens_details || {};

    // For XAI, use text_tokens from details (excludes cached tokens)
    const textTokens = promptDetails.text_tokens ?? 0;
    const cachedTokens = promptDetails.cached_tokens ?? 0;
    const promptAudioTokens = promptDetails.audio_tokens ?? 0;
    const completionAudioTokens = completionDetails.audio_tokens ?? 0;
    const reasoningTokens = completionDetails.reasoning_tokens ?? 0;

    const effectivePromptTokens = textTokens;
    const effectiveCompletionTokens = completionTokens;

    const modelUsage: ModelUsage = {
      input: effectivePromptTokens,
      output: effectiveCompletionTokens,
    };

    if (cachedTokens > 0) {
      modelUsage.cacheDetails = {
        cachedInput: cachedTokens,
      };
    }

    if (reasoningTokens > 0) {
      modelUsage.thinking = reasoningTokens;
    }

    if (promptAudioTokens > 0 || completionAudioTokens > 0) {
      modelUsage.audio = promptAudioTokens + completionAudioTokens;
    }

    const rejectedTokens = completionDetails.rejected_prediction_tokens ?? 0;
    const acceptedTokens = completionDetails.accepted_prediction_tokens ?? 0;
    if (rejectedTokens > 0 || acceptedTokens > 0) {
      modelUsage.output = effectiveCompletionTokens + acceptedTokens;
    }

    // XAI adds num_sources_used for web search
    const numSourcesUsed = usage.num_sources_used ?? 0;
    if (numSourcesUsed > 0) {
      modelUsage.web_search = numSourcesUsed;
    }

    return modelUsage;
  }
}