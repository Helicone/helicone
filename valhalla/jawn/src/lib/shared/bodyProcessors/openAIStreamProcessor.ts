import { consolidateTextFields } from "../../../utils/streamParser";
import { getTokenCountGPT3 } from "../../tokens/tokenCounter";
import { PromiseGenericResult, err, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";
import { isParseInputJson } from "./helpers";

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
  // OpenAI /responses SSE events
  "event: response.created",
  "event: response.in_progress",
  "event: response.output_item.added",
  "event: response.content_part.added",
  "event: response.output_text.delta",
  "event: response.output_text.done",
  "event: response.content_part.done",
  "event: response.output_item.done",
  "event: response.completed",
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
      .filter((line) => !NON_DATA_LINES.includes(line))
      .filter((line) => line !== "");

    const data = lines.map((line, i) => {
      try {
        return JSON.parse(line.replace("data:", ""));
      } catch (e) {
        // This line was filling up the logs
        if (!line.includes("[DONE]") && line !== "") {
          console.log("Error parsing line OpenAI", line);
        }
        return err({ msg: `Error parsing line`, line });
      }
    });

    try {
      const consolidatedData = consolidateTextFields(data);
      // since we have pricing rates that are separate for audio, input, output, and cached tokens,
      // we need to separate those components out here so that we can correctly calculate the cost.
      const usageData = consolidatedData.usage;
      let usage;
      if (usageData) {
        const effectivePromptTokens =
          usageData?.prompt_tokens !== undefined
            ? Math.max(
                0,
                (usageData.prompt_tokens ?? 0) -
                  (usageData.prompt_tokens_details?.cached_tokens ?? 0)
              )
            : usageData?.input_tokens;

        const effectiveCompletionTokens =
          usageData?.completion_tokens !== undefined
            ? Math.max(
                0,
                (usageData.completion_tokens ?? 0) -
                  (usageData.completion_tokens_details?.audio_tokens ?? 0)
              )
            : usageData?.output_tokens;

        usage = {
          totalTokens: usageData?.total_tokens,
          completionTokens: effectiveCompletionTokens,
          promptTokens: effectivePromptTokens,
          promptCacheReadTokens:
            usageData?.prompt_tokens_details?.cached_tokens,
          heliconeCalculated: usageData?.helicone_calculated ?? false,
        };
      } else {
        usage = {
          totalTokens: -1,
          completionTokens: -1,
          promptTokens: -1,
          heliconeCalculated: true,
          helicone_error:
            "counting tokens not supported, please see https://docs.helicone.ai/use-cases/enable-stream-usage",
        };
      }

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
