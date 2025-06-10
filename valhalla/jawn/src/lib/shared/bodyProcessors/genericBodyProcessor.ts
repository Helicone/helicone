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
        input_tokens?: number;
        output_tokens?: number;
        prompt_tokens_details?: {
          cached_tokens?: number;
        };
        completion_tokens_details?: {
          reasoning_tokens?: number;
        };
      };
    };

    const usage = response.usage;

    return {
      promptTokens: usage?.prompt_tokens ?? usage?.input_tokens,
      // promptCacheWriteTokens, not explicitly provided in OpenAI spec response
      // possibly can calculate for prompt_tokens > 1024, 128 token increments
      // https://openai.com/index/api-prompt-caching/
      promptCacheReadTokens: usage?.prompt_tokens_details?.cached_tokens,
      completionTokens: usage?.completion_tokens ?? usage?.output_tokens,
      totalTokens: undefined,
      heliconeCalculated: false,
    };
  }
}
