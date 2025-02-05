import { Usage } from "../../handlers/HandlerContext";
import { PromiseGenericResult, ok } from "../result";
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
        completionTokens: undefined,
        totalTokens: undefined,
        heliconeCalculated: false,
      };
    }

    if (!("usage" in parsedResponse)) {
      const nonUsageResponse = parsedResponse as {
        prompt_token_count?: number;
        generation_token_count?: number;
      };
      return {
        promptTokens: nonUsageResponse?.prompt_token_count ?? undefined,
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
      };
    };

    const usage = response.usage;

    return {
      promptTokens: usage?.prompt_tokens ?? usage?.input_tokens,
      completionTokens: usage?.completion_tokens ?? usage?.output_tokens,
      totalTokens: undefined,
      heliconeCalculated: false,
    };
  }
}
