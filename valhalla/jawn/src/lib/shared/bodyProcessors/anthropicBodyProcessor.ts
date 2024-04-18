import { getModelFromResponse } from "../../../utils/modelMapper";
import { PromiseGenericResult, ok } from "../../modules/result";
import { IBodyProcessor, ParseInput } from "./IBodyProcessor";

export class AnthropicBodyProcessor implements IBodyProcessor {
  public async parse(parseInput: ParseInput): PromiseGenericResult<any> {
    const { responseBody } = parseInput;
    const parsedResponseBody = JSON.parse(responseBody);
    const responseModel = getModelFromResponse(parsedResponseBody);
    if (responseModel.includes("claude-3")) {
      if (
        !parsedResponseBody?.usage?.output_tokens ||
        !parsedResponseBody?.usage?.input_tokens
      ) {
        return ok(parsedResponseBody);
      } else {
        return ok({
          ...parsedResponseBody,
          usage: {
            total_tokens:
              parsedResponseBody?.usage?.output_tokens +
              parsedResponseBody?.usage?.input_tokens,
            prompt_tokens: parsedResponseBody?.usage?.input_tokens,
            completion_tokens: parsedResponseBody?.usage?.output_tokens,
            helicone_calculated: true,
          },
        });
      }
    } else {
      const prompt = parsedResponseBody?.prompt ?? "";
      const completion = parsedResponseBody?.completion ?? "";
      const completionTokens = await tokenCounter(completion);
      const promptTokens = await tokenCounter(prompt);
      return ok({
        ...parsedResponseBody,
        usage: {
          total_tokens: promptTokens + completionTokens,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          helicone_calculated: true,
        },
      });
    }
  }
}
