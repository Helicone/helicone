import { consolidateTextFields } from "../../../utils/streamParser";
import { getTokenCountGPT3 } from "../../tokens/tokenCounter";
import { PromiseGenericResult, err, ok } from "../result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";
import { isParseInputJson, mapLines } from "./helpers";

export const NON_DATA_LINES = [
  "event: content_block_delta",
  "event: content_block_stop",
  "event: message_delta",
  "event: message_stop",
  "event: message_start",
  "event: content_block_start",
  "event: ping",
  "event: completion",
  "event: error",
  "event: thread.message.delta",
  "event: thread.message.completed",
  "event: thread.run.step.completed",
  "event: thread.run.step.created",
  "event: thread.run.step.in_progress",
  "event: thread.run.step.delta",
  "event: thread.run.requires_action",
  "event: done",
  "event: thread.run.queued",
  "event: thread.run.in_progress",
  "event: thread.message.created",
  "event: thread.message.in_progress",
];

function tryModel(requestData: string) {
  try {
    const parsed = JSON.parse(requestData);
    return parsed.model;
  } catch (e) {
    return undefined;
  }
}

export class OpenAIStreamProcessor implements IBodyProcessor {
  async parse(parseInput: ParseInput): PromiseGenericResult<ParseOutput> {
    if (isParseInputJson(parseInput)) {
      return ok({
        processedBody: JSON.parse(parseInput.responseBody),
      });
    }

    const { responseBody, requestBody } = parseInput;
    const lines = responseBody
      .split("\n")
      .filter((line) => !line.includes("OPENROUTER PROCESSING"))
      .filter((line) => line !== "")
      .filter((line) => !NON_DATA_LINES.includes(line));

    const data = mapLines(lines, "openai");

    try {
      const consolidatedData = consolidateTextFields(data);

      const usage =
        "usage" in consolidatedData
          ? {
              totalTokens: consolidatedData.usage?.total_tokens,
              completionTokens: consolidatedData.usage?.completion_tokens,
              promptTokens: consolidatedData.usage?.prompt_tokens,
              heliconeCalculated:
                consolidatedData.usage?.helicone_calculated ?? false,
            }
          : {
              total_tokens: -1,
              completion_tokens: -1,
              prompt_tokens: -1,
              helicone_calculated: true,
              helicone_error:
                "counting tokens not supported, please see https://docs.helicone.ai/use-cases/enable-stream-usage",
            };

      return ok({
        processedBody: {
          ...consolidatedData,
          streamed_data: data,
        },
        usage: usage,
      });
    } catch (e) {
      console.error(`Error parsing OpenAI stream response: ${e}`);
      return ok({
        processedBody: {
          streamed_data: data,
        },
        usage: undefined,
      });
    }
  }
}
