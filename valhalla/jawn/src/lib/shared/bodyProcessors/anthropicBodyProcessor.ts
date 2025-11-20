import { PromiseGenericResult, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

export class AnthropicBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput,
  ): PromiseGenericResult<ParseOutput> {
    const { responseBody } = parseInput;
    const parsedResponseBody = JSON.parse(responseBody);

    if (
      !parsedResponseBody?.usage?.output_tokens ||
      !parsedResponseBody?.usage?.input_tokens
    ) {
      if (!parsedResponseBody.input_tokens) {
        return ok({
          processedBody: parsedResponseBody,
        });
      } else {
        // handles the claude code integration response which has input_tokens at the root
        // Example: { input_tokens: 12470, context_management: { original_input_tokens: 12800 } }

        return ok({
          processedBody: parsedResponseBody,
          usage: {
            totalTokens: parsedResponseBody.input_tokens ?? 0,
            promptTokens: parsedResponseBody.input_tokens ?? 0,
            promptCacheWriteTokens: 0,
            promptCacheReadTokens: 0,
            completionTokens: 0,
          },
        });
      }
    } else {
      return ok({
        processedBody: parsedResponseBody,
        usage: {
          totalTokens:
            (parsedResponseBody?.usage?.input_tokens ?? 0) +
            (parsedResponseBody?.usage?.output_tokens ?? 0) +
            (parsedResponseBody?.usage?.cache_creation_input_tokens ?? 0) +
            (parsedResponseBody?.usage?.cache_read_input_tokens ?? 0),
          promptTokens: parsedResponseBody?.usage?.input_tokens,
          promptCacheWriteTokens:
            parsedResponseBody?.usage?.cache_creation_input_tokens,
          promptCacheReadTokens:
            parsedResponseBody?.usage?.cache_read_input_tokens,
          completionTokens: parsedResponseBody?.usage?.output_tokens,
          promptCacheWrite5m:
            parsedResponseBody?.usage?.cache_creation
              ?.ephemeral_5m_input_tokens,
          promptCacheWrite1h:
            parsedResponseBody?.usage?.cache_creation
              ?.ephemeral_1h_input_tokens,
        },
      });
    }
  }
}
