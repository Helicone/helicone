import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";

export class VertexUsageProcessor implements IUsageProcessor {
  public async parse(parseInput: ParseInput): Promise<Result<ModelUsage, string>> {
    try {
      const response = JSON.parse(parseInput.responseBody);

      // Vertex AI (Gemini) returns usage in a similar format to Google AI Studio
      if (response.usageMetadata) {
        return {
          data: {
            input: response.usageMetadata.promptTokens || response.usageMetadata.prompt_token_count || 0,
            output: response.usageMetadata.candidatesTokens || response.usageMetadata.candidates_token_count || 0,
          },
          error: null,
        };
      }

      // Alternative format for Vertex AI
      if (response.metadata?.tokenMetadata) {
        const tokenMetadata = response.metadata.tokenMetadata;
        return {
          data: {
            input: tokenMetadata.inputTokenCount || tokenMetadata.promptTokens || 0,
            output: tokenMetadata.outputTokenCount || tokenMetadata.candidatesTokens || 0,
          },
          error: null,
        };
      }

      // For OpenAI-compatible format (used by Gemini via Vertex)
      if (response.usage) {
        return {
          data: {
            input: response.usage.prompt_tokens || 0,
            output: response.usage.completion_tokens || 0,
          },
          error: null,
        };
      }

      // Fallback: try to extract from candidates if available
      if (response.candidates && Array.isArray(response.candidates)) {
        // Some Vertex responses have token counts in the candidates
        let totalCompletionTokens = 0;

        for (const candidate of response.candidates) {
          if (candidate.tokenCount) {
            totalCompletionTokens += candidate.tokenCount;
          }
        }

        if (totalCompletionTokens > 0) {
          return {
            data: {
              input: 0, // Can't determine from this format
              output: totalCompletionTokens,
            },
            error: null,
          };
        }
      }

      return {
        data: null,
        error: "No usage data found in Vertex AI response",
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to parse Vertex AI usage: ${error}`,
      };
    }
  }
}