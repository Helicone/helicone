import { ModelUsage } from "./types";
import { AnthropicUsageProcessor } from "./anthropicUsageProcessor";

export class BedrockUsageProcessor extends AnthropicUsageProcessor {
  protected extractUsageFromResponse(parsedResponse: any): ModelUsage {
    if (!parsedResponse || typeof parsedResponse !== "object") {
      return {
        input: 0,
        output: 0,
      };
    }

    const usage = parsedResponse.usage || {};

    const inputTokens = usage.input_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    const cacheReadInputTokens = usage.cache_read_input_tokens ?? 0;

    // Bedrock does not support complex cache writes like Anthropic
    // and cache creation details are not available.

    const cacheWriteInputTokens = usage.cache_creation_input_tokens ?? 0;

    const modelUsage: ModelUsage = {
      input: inputTokens,
      output: outputTokens,
    };

    if (cacheReadInputTokens > 0 || cacheWriteInputTokens > 0) {
      modelUsage.cacheDetails = {
        cachedInput: cacheReadInputTokens,
        write5m: cacheWriteInputTokens,
      };
    }

    return modelUsage;
  }
}
