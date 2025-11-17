import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";

export class GoogleUsageProcessor implements IUsageProcessor {
  public async parse(parseInput: ParseInput): Promise<Result<ModelUsage, string>> {
    try {
      const response = JSON.parse(parseInput.responseBody);

      // Google AI Studio (Gemini) format
      if (response.usageMetadata) {
        //response made when creating cached content
        if (response.name && response.name.includes("cachedContent")) {
          return {
            data: { input: 0, output: 0, cacheDetails: { cachedInput: 0, write5m: response.usageMetadata.totalTokenCount || 0 } },
            error: null,
          }
        }
        return {
          data: {
            input: (response.usageMetadata.promptTokens || response.usageMetadata.promptTokenCount || 0) - (response.usageMetadata.cachedContentTokenCount || 0),
            output: response.usageMetadata.candidatesTokens || response.usageMetadata.candidatesTokenCount || 0,
          },
          error: null,
        };
      }

      // Alternative format (OpenAI-compatible)
      if (response.usage) {
        return {
          data: {
            input: (response.usage.prompt_tokens || response.usage.promptTokens) - (response.usage.prompt_token_details.cached_tokens || 0) || 0,
            output: response.usage.completion_tokens || response.usage.completionTokens || 0,
            cacheDetails: {
              cachedInput: response.usage.prompt_token_details.cached_tokens || 0,
            },
          },
          error: null,
        };
      }

      return {
        data: null,
        error: "No usage data found in Google AI response",
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to parse Google AI usage: ${error}`,
      };
    }
  }
}
