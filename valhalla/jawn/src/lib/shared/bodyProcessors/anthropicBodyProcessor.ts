import { getModelFromResponse } from "../../../utils/modelMapper";
import { PromiseGenericResult, ok } from "../../modules/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

export class AnthropicBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput
  ): PromiseGenericResult<ParseOutput> {
    const { responseBody, tokenCounter, model } = parseInput;
    const parsedResponseBody = JSON.parse(responseBody);
    if (model?.includes("claude-3")) {
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
              parsedResponseBody?.usage?.output_tokens +
              parsedResponseBody?.usage?.input_tokens,
            promptTokens: parsedResponseBody?.usage?.input_tokens,
            completionTokens: parsedResponseBody?.usage?.output_tokens,
            heliconeCalculated: true,
          },
        });
      }
    } else {
      const prompt = parsedResponseBody?.prompt ?? "";
      const completion = parsedResponseBody?.completion ?? "";
      const completionTokens = await tokenCounter(completion);
      const promptTokens = await tokenCounter(prompt);
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
