import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";

export class GoogleUsageProcessor implements IUsageProcessor {
  public async parse(parseInput: ParseInput): Promise<Result<ModelUsage, string>> {
    try {
      const response = JSON.parse(parseInput.responseBody);

      // Google AI Studio (Gemini) format
      if (response.usageMetadata) {
        return {
          data: {
            input: response.usageMetadata.promptTokens || response.usageMetadata.promptTokenCount || 0,
            output: response.usageMetadata.candidatesTokens || response.usageMetadata.candidatesTokenCount || 0,
          },
          error: null,
        };
      }

      // Alternative format (OpenAI-compatible)
      if (response.usage) {
        return {
          data: {
            input: response.usage.prompt_tokens || response.usage.promptTokens || 0,
            output: response.usage.completion_tokens || response.usage.completionTokens || 0,
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