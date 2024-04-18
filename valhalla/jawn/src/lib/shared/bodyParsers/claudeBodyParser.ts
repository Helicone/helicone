import { getModelFromResponse } from "../../../utils/modelMapper";
import { PromiseGenericResult, ok } from "../../modules/result";

export interface IBodyParser {
  parse(body: string): any;
}

export class ClaudeBodyParser implements IBodyParser {
  public async parse(body: string): PromiseGenericResult<any> {
    const parsedBody = JSON.parse(body);
    const responseModel = getModelFromResponse(parsedBody);
    if (responseModel.includes("claude-3")) {
      if (
        !parsedBody?.usage?.output_tokens ||
        !parsedBody?.usage?.input_tokens
      ) {
        return ok(parsedBody);
      } else {
        return ok({
          ...parsedBody,
          usage: {
            total_tokens:
              parsedBody?.usage?.output_tokens +
              parsedBody?.usage?.input_tokens,
            prompt_tokens: parsedBody?.usage?.input_tokens,
            completion_tokens: parsedBody?.usage?.output_tokens,
            helicone_calculated: true,
          },
        });
      }
    } else {
      const prompt = parsedBody?.prompt ?? "";
      const completion = parsedBody?.completion ?? "";
      const completionTokens = await tokenCounter(completion);
      const promptTokens = await tokenCounter(prompt);
      return ok({
        ...parsedBody,
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
