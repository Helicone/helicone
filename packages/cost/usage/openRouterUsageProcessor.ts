import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";

export const OPENROUTER_PTB_MARKUP = 1.055;
export interface OpenRouterCostDetails {
  upstream_inference_cost?: number;
  upstream_inference_prompt_cost?: number;
  upstream_inference_completions_cost?: number;
}

export function getOpenRouterDeclaredCost(
  cost?: number,
  cost_details?: OpenRouterCostDetails
): number | undefined {
  // Priority 1: Direct cost field
  if (cost && cost > 0) {
    return cost;
  }

  // Priority 2: Upstream inference cost
  if (cost_details?.upstream_inference_cost && cost_details.upstream_inference_cost > 0) {
    return cost_details.upstream_inference_cost;
  }

  // Priority 3: Sum of prompt and completion costs
  if (
    cost_details?.upstream_inference_prompt_cost &&
    cost_details?.upstream_inference_completions_cost &&
    cost_details.upstream_inference_prompt_cost > 0 &&
    cost_details.upstream_inference_completions_cost > 0
  ) {
    return cost_details.upstream_inference_prompt_cost + cost_details.upstream_inference_completions_cost;
  }

  return undefined;
}

export interface OpenRouterUsage extends ModelUsage {
  cost_details?: OpenRouterCostDetails;
  provider?: string; // Actual provider used (e.g., "google", "anthropic")
  is_byok?: boolean; // Whether using customer's own API keys
}

export class OpenRouterUsageProcessor implements IUsageProcessor {
  public async parse(parseInput: ParseInput): Promise<Result<OpenRouterUsage, string>> {
    try {
      if (parseInput.isStream) {
        return this.parseStreamResponse(parseInput.responseBody, parseInput.isPassthroughBilling);
      } else {
        return this.parseNonStreamResponse(parseInput.responseBody, parseInput.isPassthroughBilling);
      }
    } catch (error) {
      return {
        data: null,
        error: `Failed to parse OpenRouter usage: ${error}`,
      };
    }
  }

  protected parseNonStreamResponse(responseBody: string, isPassthroughBilling: boolean): Result<OpenRouterUsage, string> {
    try {
      const parsedResponse = JSON.parse(responseBody);
      const usage = this.extractUsageFromResponse(parsedResponse, isPassthroughBilling);

      return {
        data: usage,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to parse non-stream response: ${error}`,
      };
    }
  }

  protected parseStreamResponse(responseBody: string, isPassthroughBilling: boolean): Result<OpenRouterUsage, string> {
    try {
      const lines = responseBody
        .split("\n")
        .filter((line) => line.trim() !== "" && !line.includes("OPENROUTER PROCESSING"))
        .map((line) => {
          if (line === "data: [DONE]") return null;
          try {
            return JSON.parse(line.replace("data: ", ""));
          } catch {
            return null;
          }
        })
        .filter((data) => data !== null);

      const consolidatedData = this.consolidateStreamData(lines);
      const usage = this.extractUsageFromResponse(consolidatedData, isPassthroughBilling);

      return {
        data: usage,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to parse stream response: ${error}`,
      };
    }
  }

  protected consolidateStreamData(streamData: any[]): any {
    // Look for the last chunk with usage data
    const lastChunkWithUsage = [...streamData].reverse().find(chunk => chunk?.usage);
    if (lastChunkWithUsage?.usage) {
      return lastChunkWithUsage;
    }

    // If no chunk has usage, consolidate from all chunks
    const consolidated: any = {
      choices: [],
      usage: null,
    };

    for (const chunk of streamData) {
      if (chunk?.usage) {
        consolidated.usage = chunk.usage;
      }
      if (chunk?.id) {
        consolidated.id = chunk.id;
      }
      if (chunk?.model) {
        consolidated.model = chunk.model;
      }
    }

    return consolidated;
  }

  protected extractUsageFromResponse(parsedResponse: any, isPassthroughBilling: boolean): OpenRouterUsage {
    if (!parsedResponse || typeof parsedResponse !== "object") {
      return {
        input: 0,
        output: 0,
      };
    }

    const usage = parsedResponse.usage || {};

    // OpenRouter provides direct cost in USD
    const cost = usage.cost;
    const cost_details = usage.cost_details;
    const provider = usage.provider;
    const is_byok = usage.is_byok;

    // OpenRouter still provides token counts for compatibility
    const promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;

    const promptDetails = usage.prompt_tokens_details || {};
    const completionDetails = usage.completion_tokens_details || {};

    const cachedTokens = promptDetails.cached_tokens ?? 0;
    const promptAudioTokens = promptDetails.audio_tokens ?? 0;
    const completionAudioTokens = completionDetails.audio_tokens ?? 0;
    const reasoningTokens = completionDetails.reasoning_tokens ?? 0;

    // Calculate effective tokens (for logging/analytics, not for cost)
    const effectivePromptTokens = Math.max(0, promptTokens - cachedTokens - promptAudioTokens);
    const effectiveCompletionTokens = Math.max(0, completionTokens - completionAudioTokens - reasoningTokens);

    // Get declared cost and apply passthrough billing markup if needed
    let declaredCost = getOpenRouterDeclaredCost(cost, cost_details);
    if (isPassthroughBilling && declaredCost !== undefined) {
      declaredCost *= OPENROUTER_PTB_MARKUP;
    }
    const modelUsage: OpenRouterUsage = {
      input: effectivePromptTokens,
      output: effectiveCompletionTokens,
      cost: declaredCost,

      // OpenRouterUsage specific info
      cost_details: cost_details,
      provider: provider,
      is_byok: is_byok,
    };

    // Still track cache details for analytics
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