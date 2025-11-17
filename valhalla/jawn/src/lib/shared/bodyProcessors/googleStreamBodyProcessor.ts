import { consolidateGoogleTextFields } from "../../../utils/streamParser";
import { PromiseGenericResult, err, ok } from "../../../packages/common/result";
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

    const lines = responseBody.split("\n").filter((line) => {
      if (line.startsWith("data: ")) {
        return true;
      }
      try {
        JSON.parse(line);
        return true;
      } catch {
        return false;
      }
    });

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
          promptCacheWriteTokens: usage.promptCacheWriteTokens,
          promptCacheReadTokens: usage.promptCacheReadTokens,
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
  promptCacheWriteTokens?: number;
  promptCacheReadTokens?: number;
} {
  try {
    const lastData = streamedData[streamedData.length - 1];

    // Check for Anthropic-specific structure (Claude models via Google)
    if (
      lastData &&
      lastData.usage &&
      "input_tokens" in lastData.usage &&
      "output_tokens" in lastData.usage
    ) {
      return {
        total_tokens:
          lastData.usage.input_tokens + lastData.usage.output_tokens,
        completion_tokens: lastData.usage.output_tokens,
        prompt_tokens: lastData.usage.input_tokens,
        promptCacheWriteTokens: lastData.usage.cache_creation_input_tokens ?? 0,
        promptCacheReadTokens: lastData.usage.cache_read_input_tokens ?? 0,
      };
    }
    // Standard Google usage metadata format
    else if (lastData && lastData.usageMetadata) {
      const promptTokens = lastData.usageMetadata.promptTokenCount ?? 0;
      const cachedContentTokens =
        lastData.usageMetadata.cachedContentTokenCount ?? 0;
      return {
        total_tokens: lastData.usageMetadata.totalTokenCount,
        completion_tokens: lastData.usageMetadata.candidatesTokenCount,
        prompt_tokens: promptTokens - cachedContentTokens,
        promptCacheReadTokens: cachedContentTokens,
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
