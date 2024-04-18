import { PromiseGenericResult, ok } from "../../modules/result";
import { IBodyProcessor, ParseInput } from "./IBodyProcessor";

export class GoogleBodyProcessor implements IBodyProcessor {
  public async parse(parseInput: ParseInput): PromiseGenericResult<any> {
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
      usage: {
        total_tokens: usageMetadataItem?.usageMetadata?.totalTokenCount,
        prompt_tokens: usageMetadataItem?.usageMetadata?.promptTokenCount,
        completion_tokens:
          usageMetadataItem?.usageMetadata?.candidatesTokenCount,
        helicone_calculated: false,
      },
    });
  }
}
