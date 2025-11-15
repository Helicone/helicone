import { PromiseGenericResult, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

// Deprecated: Use GoogleUsageProcessor instead (AI Gateway)
export class GoogleBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput,
  ): PromiseGenericResult<ParseOutput> {
    const { responseBody } = parseInput;
    const parsedResponseBody = JSON.parse(responseBody);

    console.log("Google response body:", parsedResponseBody);
    console.log("Extra google properties:", parsedResponseBody.usageMetadata?.extra_properties?.google);
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

    // Explicit cache creation responses (cachedContent)
    if (
      !Array.isArray(parsedResponseBody) &&
      parsedResponseBody.usageMetadata &&
      typeof parsedResponseBody.name === "string" &&
      parsedResponseBody.name.includes("cachedContent")
    ) {
      const totalTokenCount =
        parsedResponseBody.usageMetadata.totalTokenCount ?? 0;

      return ok({
        processedBody: parsedResponseBody,
        usage: {
          totalTokens: totalTokenCount,
          promptTokens: 0,
          completionTokens: 0,
          promptCacheWriteTokens: totalTokenCount,
          promptCacheReadTokens: 0,
          promptCacheWrite5m: totalTokenCount,
          promptCacheWrite1h: 0,
          heliconeCalculated: false,
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

    const promptTokens = usageMetadataItem?.usageMetadata
      ?.promptTokenCount;
    console.log('promptTokens:', promptTokens);
    const cachedContentTokens = usageMetadataItem?.usageMetadata
      ?.cachedContentTokenCount;
    console.log('cachedContentTokens:', cachedContentTokens);
    const adjustedPromptTokens =
      promptTokens !== undefined && cachedContentTokens !== undefined
        ? promptTokens - cachedContentTokens
        : undefined;
    console.log('adjustedPromptTokens:', adjustedPromptTokens);

    return ok({
      processedBody: parsedResponseBody,
      usage: {
        totalTokens: usageMetadataItem?.usageMetadata?.totalTokenCount,
        promptTokens: adjustedPromptTokens,
        completionTokens:
          (usageMetadataItem?.usageMetadata?.thoughtsTokenCount ?? 0) +
          (usageMetadataItem?.usageMetadata?.candidatesTokenCount ?? 0),
        heliconeCalculated: false,
        promptCacheReadTokens: cachedContentTokens,
      },
    });
  }
}
