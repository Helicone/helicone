import { PromiseGenericResult, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

export class GoogleBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput,
  ): PromiseGenericResult<ParseOutput> {
    const { responseBody } = parseInput;
    const parsedResponseBody = JSON.parse(responseBody);

    // Check for Anthropic-specific usage format
    if (
      parsedResponseBody.usage &&
      "input_tokens" in parsedResponseBody.usage &&
      "output_tokens" in parsedResponseBody.usage
    ) {
      return ok({
        processedBody: parsedResponseBody,
        usage: {
          totalTokens:
            parsedResponseBody.usage.input_tokens +
            parsedResponseBody.usage.output_tokens,
          promptTokens: parsedResponseBody.usage.input_tokens,
          completionTokens: parsedResponseBody.usage.output_tokens,
          promptCacheWriteTokens:
            parsedResponseBody.usage.cache_creation_input_tokens ?? 0,
          promptCacheReadTokens:
            parsedResponseBody.usage.cache_read_input_tokens ?? 0,
        },
      });
    }

    // Standard Google format
    let usageMetadataItem;
    if (Array.isArray(parsedResponseBody)) {
      usageMetadataItem = parsedResponseBody.find((item) => item.usageMetadata);
    } else {
      usageMetadataItem = parsedResponseBody.usageMetadata
        ? parsedResponseBody
        : undefined;
    }

    return ok({
      processedBody: parsedResponseBody,
      usage: {
        totalTokens: usageMetadataItem?.usageMetadata?.totalTokenCount,
        promptTokens: usageMetadataItem?.usageMetadata?.promptTokenCount,
        completionTokens:
          (usageMetadataItem?.usageMetadata?.thoughtsTokenCount ?? 0) +
          (usageMetadataItem?.usageMetadata?.candidatesTokenCount ?? 0),
        heliconeCalculated: false,
      },
    });
  }
}
