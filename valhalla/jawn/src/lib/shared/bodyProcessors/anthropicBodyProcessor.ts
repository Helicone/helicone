import {
  calculateModel,
  getModelFromResponse,
} from "../../../utils/modelMapper";
import { getTokenCountAnthropic } from "../../tokens/tokenCounter";
import { PromiseGenericResult, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

export class AnthropicBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput
  ): PromiseGenericResult<ParseOutput> {
    const { responseBody, requestModel, modelOverride } = parseInput;
    const parsedResponseBody = JSON.parse(responseBody);
    const responseModel = getModelFromResponse(parsedResponseBody);
    const model = calculateModel(requestModel, responseModel, modelOverride);
    if (
      model?.includes("claude-3") ||
      model?.includes("claude-sonnet-4") ||
      model?.includes("claude-opus-4") ||
      // for AI SDK
      model?.includes("claude-4")
    ) {
      if (
        !parsedResponseBody?.usage?.output_tokens ||
        !parsedResponseBody?.usage?.input_tokens
      ) {
        return ok({
          processedBody: parsedResponseBody,
        });
      } else {
        return ok({
          processedBody: parsedResponseBody,
          usage: {
            totalTokens:
              parsedResponseBody?.usage?.input_tokens +
              parsedResponseBody?.usage?.output_tokens,
            promptTokens: parsedResponseBody?.usage?.input_tokens,
            promptCacheWriteTokens:
              parsedResponseBody?.usage?.cache_creation_input_tokens,
            promptCacheReadTokens:
              parsedResponseBody?.usage?.cache_read_input_tokens,
            completionTokens: parsedResponseBody?.usage?.output_tokens,
            promptCacheWrite5m:
              parsedResponseBody?.usage?.cache_creation.ephemeral_5m_input_tokens,
            promptCacheWrite1h:
              parsedResponseBody?.usage?.cache_creation.ephemeral_1h_input_tokens,
            heliconeCalculated: true,
          },
        });
      }
    } else {
      const prompt = parsedResponseBody?.prompt ?? "";
      const completion = parsedResponseBody?.completion ?? "";
      const completionTokens = await getTokenCountAnthropic(completion);
      const promptTokens = await getTokenCountAnthropic(prompt);
      return ok({
        processedBody: parsedResponseBody,
        usage: {
          totalTokens: promptTokens + completionTokens,
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          heliconeCalculated: true,
        },
      });
    }
  }
}
