import { consolidateGoogleTextFields } from "../../../utils/streamParser";
import { PromiseGenericResult, err, ok } from "../result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";
import { isParseInputJson } from "./helpers";

export class GoogleStreamBodyProcessor implements IBodyProcessor {
  async parse(parseInput: ParseInput): PromiseGenericResult<ParseOutput> {
    if (isParseInputJson(parseInput)) {
      return ok({
        processedBody: JSON.parse(parseInput.responseBody),
      });
    }

    const { responseBody } = parseInput;

    const lines = responseBody
      .split("\n")
      .filter((line) => line.startsWith("data: "));

    const data = lines.reduce((acc: any[], line, index) => {
      try {
        if (index === lines.length - 1 && line === "") return acc;
        const parsedLine = JSON.parse(line.replace("data: ", ""));
        acc.push(parsedLine);
      } catch (e) {
        console.log("Error parsing line Google", line);
      }
      return acc;
    }, []);

    if (data.length === 0) {
      return err("No valid data to process");
    }

    try {
      const usage = getUsage(data);
      return ok({
        processedBody: {
          ...consolidateGoogleTextFields(data),
          streamed_data: data,
        },
        usage: {
          totalTokens: usage.total_tokens,
          completionTokens: usage.completion_tokens,
          promptTokens: usage.prompt_tokens,
          heliconeCalculated: true,
        },
      });
    } catch (e) {
      console.error(`Error parsing Google stream response: ${e}`);
      return ok({
        processedBody: {
          streamed_data: data,
        },
        usage: undefined,
      });
    }
  }
}

function getUsage(streamedData: any[]): {
  total_tokens: number;
  completion_tokens: number;
  prompt_tokens: number;
} {
  try {
    const lastData = streamedData[streamedData.length - 1];
    if (lastData && lastData.usageMetadata) {
      return {
        total_tokens: lastData.usageMetadata.totalTokenCount,
        completion_tokens: lastData.usageMetadata.candidatesTokenCount,
        prompt_tokens: lastData.usageMetadata.promptTokenCount,
      };
    } else {
      throw new Error("Usage metadata not found");
    }
  } catch (e) {
    console.error("Error getting usage", e);
    return {
      total_tokens: -1,
      completion_tokens: -1,
      prompt_tokens: -1,
    };
  }
}
