import { Usage } from "../../handlers/HandlerContext";
import { PromiseGenericResult, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

export class GenericBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput
  ): PromiseGenericResult<ParseOutput> {
    const parsedResponseBody = JSON.parse(parseInput.responseBody);

    return ok({
      processedBody: parsedResponseBody,
      usage: this.getUsage(parsedResponseBody),
    });
  }

  getUsage(parsedResponse: unknown): Usage {
    if (typeof parsedResponse !== "object" || parsedResponse === null) {
      return {
        promptTokens: undefined,
        promptCacheWriteTokens: undefined,
        promptCacheReadTokens: undefined,
        completionTokens: undefined,
        totalTokens: undefined,
        heliconeCalculated: false,
      };
    }

    if (!("usage" in parsedResponse)) {
      const nonUsageResponse = parsedResponse as {
        prompt_token_count?: number;
        prompt_cache_write_token_count?: number;
        prompt_cache_read_token_count?: number;
        generation_token_count?: number;
      };
      return {
        promptTokens: nonUsageResponse?.prompt_token_count ?? undefined,
        promptCacheWriteTokens:
          nonUsageResponse?.prompt_cache_write_token_count ?? undefined,
        promptCacheReadTokens:
          nonUsageResponse?.prompt_cache_read_token_count ?? undefined,
        completionTokens: nonUsageResponse?.generation_token_count ?? undefined,
        totalTokens: undefined,
        heliconeCalculated: false,
      };
    }

    const response = parsedResponse as {
      usage: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
        prompt_tokens_details?: {
          cached_tokens?: number;
          audio_tokens?: number;
        };
        completion_tokens_details?: {
          reasoning_tokens?: number;
          audio_tokens?: number;
          accepted_prediction_tokens?: number;
          rejected_prediction_tokens?: number;
        };
        
        // OpenAI Responses API
        input_tokens?: number;
        output_tokens?: number;
        input_tokens_details?: {
          cached_tokens?: number;
        };
        output_tokens_details?: {
          reasoning_tokens?: number;
        };
      };
    };

    // OpenAI charges for input, input cache read, output, output audio, input audio.
    const usage = response.usage;
    const effectivePromptTokens = usage?.prompt_tokens !== undefined
        ? Math.max(0, (usage.prompt_tokens ?? 0) - (usage.prompt_tokens_details?.cached_tokens ?? 0) - (usage.prompt_tokens_details?.audio_tokens ?? 0))
        : Math.max(0, (usage.input_tokens ?? 0) - (usage.input_tokens_details?.cached_tokens ?? 0));
    const effectiveCompletionTokens = usage?.completion_tokens !== undefined
        ? Math.max(0, (usage.completion_tokens ?? 0) - (usage.completion_tokens_details?.reasoning_tokens ?? 0) - (usage.completion_tokens_details?.audio_tokens ?? 0))
        : Math.max(0, (usage.output_tokens ?? 0) - (usage.output_tokens_details?.reasoning_tokens ?? 0));

    return {
      promptTokens: effectivePromptTokens,
      promptCacheReadTokens: usage?.prompt_tokens_details?.cached_tokens ?? usage?.input_tokens_details?.cached_tokens ?? 0,
      completionTokens: effectiveCompletionTokens,
      totalTokens: usage?.total_tokens,
      heliconeCalculated: false,
    };
  }
}
