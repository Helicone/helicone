import { PromiseGenericResult, ok } from "../result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

export class GoogleBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput
  ): PromiseGenericResult<ParseOutput> {
    const { responseBody } = parseInput;
    const parsedResponseBody = JSON.parse(responseBody);

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
          usageMetadataItem?.usageMetadata?.candidatesTokenCount,
        heliconeCalculated: false,
      },
    });
  }
}
