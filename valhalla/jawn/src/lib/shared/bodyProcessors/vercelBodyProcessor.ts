import { Usage } from "../../handlers/HandlerContext";
import { PromiseGenericResult, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

export class VercelBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput
  ): PromiseGenericResult<ParseOutput> {
    const { responseBody } = parseInput;
    const parsedResponseBody = JSON.parse(responseBody);

    return ok({
      processedBody: parsedResponseBody,
      usage: this.getUsage(parsedResponseBody),
    });
  }

  private getUsage(parsedResponse: any): Usage {
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

    const usage = parsedResponse.usage;
    if (!usage) {
      return {
        promptTokens: undefined,
        promptCacheWriteTokens: undefined,
        promptCacheReadTokens: undefined,
        completionTokens: undefined,
        totalTokens: undefined,
        heliconeCalculated: false,
      };
    }

    return {
      promptTokens: usage.inputTokens,
      promptCacheWriteTokens: undefined,
      promptCacheReadTokens: undefined,
      completionTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      heliconeCalculated: false,
    };
  }
}
