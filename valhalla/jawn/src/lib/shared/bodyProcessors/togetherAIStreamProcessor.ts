import { consolidateTextFields } from "../../../utils/streamParser";
import { PromiseGenericResult, err, ok } from "../result";
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
];

export class TogetherAIStreamProcessor implements IBodyProcessor {
  async parse(parseInput: ParseInput): PromiseGenericResult<ParseOutput> {
    if (isParseInputJson(parseInput)) {
      return ok({
        processedBody: JSON.parse(parseInput.responseBody),
      });
    }

    const { responseBody } = parseInput;
    const lines = responseBody
      .split("\n")
      .filter((line) => !line.includes("OPENROUTER PROCESSING"))
      .filter((line) => line !== "")
      .filter((line) => !NON_DATA_LINES.includes(line));

    const data = lines.map((line, i) => {
      if (i === lines.length - 1) return {};
      try {
        return JSON.parse(line.replace("data:", ""));
      } catch (e) {
        console.log("Error parsing line TogetherAI", line);
        return err({ msg: `Error parsing line`, line });
      }
    });

    try {
      const usage = await getUsage(data);
      return ok({
        processedBody: {
          ...consolidateTextFields(data),
          streamed_data: data,
        },
        usage: {
          totalTokens: usage.total_tokens,
          completionTokens: usage.completion_tokens,
          promptTokens: usage.prompt_tokens,
          heliconeCalculated: usage.helicone_calculated,
        },
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

export async function getUsage(streamedData: any[]): Promise<{
  total_tokens: number;
  completion_tokens: number;
  prompt_tokens: number;
  helicone_calculated: boolean;
}> {
  try {
    const filteredData = streamedData.filter((data) => data.usage !== null);
    if (filteredData.length === 0 || !filteredData[0].usage) {
      throw new Error("No valid usage data found");
    }

    const usage = filteredData[0].usage;
    return {
      total_tokens: usage.total_tokens,
      completion_tokens: usage.completion_tokens,
      prompt_tokens: usage.prompt_tokens,
      helicone_calculated: true,
    };
  } catch (e) {
    console.error("Error getting usage for TogetherAI", e);
    return {
      total_tokens: -1,
      completion_tokens: -1,
      prompt_tokens: -1,
      helicone_calculated: false,
    };
  }
}
