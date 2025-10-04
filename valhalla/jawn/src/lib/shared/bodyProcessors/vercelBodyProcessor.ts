import { Usage } from "../../handlers/HandlerContext";
import { PromiseGenericResult, ok, err } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

export class VercelBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput,
  ): PromiseGenericResult<ParseOutput> {
    const { responseBody } = parseInput;

    let parsedResponseBody: any;
    try {
      parsedResponseBody = JSON.parse(responseBody);
    } catch (e) {
      console.error("Error parsing Vercel response body as JSON:", e);
      return err(`Failed to parse Vercel response body: ${e}`);
    }

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

    // Handle both Vercel's native format and OpenAI-compatible format
    return {
      promptTokens: usage.inputTokens || usage.prompt_tokens,
      promptCacheWriteTokens: undefined,
      promptCacheReadTokens: undefined,
      completionTokens: usage.outputTokens || usage.completion_tokens,
      totalTokens: usage.totalTokens || usage.total_tokens,
      heliconeCalculated: false,
    };
  }
}
