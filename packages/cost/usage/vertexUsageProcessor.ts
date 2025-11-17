import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";
import { BedrockUsageProcessor } from "./bedrockUsageProcessor";
import { OpenAIUsageProcessor } from "./openAIUsageProcessor";

export class VertexOpenAIUsageProcessor extends OpenAIUsageProcessor {
  protected extractUsageFromResponse(parsedResponse: any): ModelUsage {
    if (!parsedResponse || typeof parsedResponse !== "object") {
      return {
        input: 0,
        output: 0,
      };
    }

    const usage = parsedResponse.usage || {};

    // For Vertex AI, completion_tokens does NOT include reasoning_tokens or audio_tokens
    const promptTokens = usage.prompt_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? 0;

    const promptDetails = usage.prompt_tokens_details || {};
    const completionDetails = usage.completion_tokens_details || {};

    const cachedTokens = promptDetails.cached_tokens ?? 0;
    const promptAudioTokens = promptDetails.audio_tokens ?? 0;
    const completionAudioTokens = completionDetails.audio_tokens ?? 0;
    const reasoningTokens = completionDetails.reasoning_tokens ?? 0;

    const effectivePromptTokens = Math.max(0, promptTokens - cachedTokens - promptAudioTokens);
    // For Vertex, completion_tokens is already the effective tokens (no reasoning/audio included)
    const effectiveCompletionTokens = Math.max(0, completionTokens - completionAudioTokens);

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

    return modelUsage;
  }
}

export class VertexUsageProcessor implements IUsageProcessor {
  public async parse(parseInput: ParseInput): Promise<Result<ModelUsage, string>> {
    if (parseInput.model.includes("claude")) {
      // Both bedrock and vertex don't support 1h buckets like Anthropic does.
      return new BedrockUsageProcessor().parse(parseInput);
    } else {
      return new VertexOpenAIUsageProcessor().parse(parseInput);
    }
  }
}