import {
  calculateModel,
  getModelFromResponse,
} from "../../../utils/modelMapper";
import { PromiseGenericResult, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";
import { CreateChatCompletionResponse } from "llama-api-client/resources/chat/chat";

export class LlamaBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput,
  ): PromiseGenericResult<ParseOutput> {
    const { responseBody, requestModel, modelOverride } = parseInput;
    const parsedResponseBody: CreateChatCompletionResponse =
      JSON.parse(responseBody);
    const responseModel = getModelFromResponse(parsedResponseBody);
    const model = calculateModel(requestModel, responseModel, modelOverride);

    const metrics = parsedResponseBody.metrics || [];
    const promptTokensMetric = metrics.find(
      (m) => m.metric === "num_prompt_tokens",
    );
    const completionTokensMetric = metrics.find(
      (m) => m.metric === "num_completion_tokens",
    );
    const totalTokensMetric = metrics.find(
      (m) => m.metric === "num_total_tokens",
    );

    if (promptTokensMetric && completionTokensMetric) {
      return ok({
        processedBody: parsedResponseBody,
        usage: {
          totalTokens:
            totalTokensMetric?.value ||
            promptTokensMetric.value + completionTokensMetric.value,
          promptTokens: promptTokensMetric.value,
          completionTokens: completionTokensMetric.value,
          heliconeCalculated: false,
        },
      });
    } else {
      // TODO: Only Llama 3 models have an open tokenizer, should look into if Llama 4 uses the same tokenizer
      // For now, return the response without token counts if metrics are missing
      return ok({
        processedBody: parsedResponseBody,
      });
    }
  }
}
