import { consolidateTextFields } from "../../../utils/streamParser";
import { PromiseGenericResult, err, ok } from "../result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";
import { isParseInputJson } from "./helpers";
import { NON_DATA_LINES } from "./openAIStreamProcessor";

/**
 * Body processor for Groq API streaming responses
 * Groq follows OpenAI-compatible streaming format but puts token usage in x_groq field
 */
export class GroqStreamProcessor implements IBodyProcessor {
  async parse(parseInput: ParseInput): PromiseGenericResult<ParseOutput> {
    if (isParseInputJson(parseInput)) {
      return ok({
        processedBody: JSON.parse(parseInput.responseBody),
      });
    }

    const { responseBody } = parseInput;
    const lines = responseBody
      .split("\n")
      .filter((line) => line !== "")
      .filter((line) => !NON_DATA_LINES.includes(line));

    const data = lines.map((line, i) => {
      try {
        return JSON.parse(line.replace("data:", ""));
      } catch (e) {
        console.log("Error parsing line Groq", line);
        return { msg: `Error parsing line`, line };
      }
    });

    try {
      // We need the consolidated data for the response structure
      const consolidatedData = consolidateTextFields(data);

      // Directly look for the chunk with usage data in the original data
      const chunkWithXGroq = data.find(
        (chunk) =>
          chunk &&
          typeof chunk === "object" &&
          chunk.x_groq &&
          chunk.x_groq.usage
      );

      let usage = {};

      if (chunkWithXGroq?.x_groq?.usage) {
        // Extract usage from x_groq field
        const groqUsage = chunkWithXGroq.x_groq.usage;
        usage = {
          totalTokens: groqUsage.total_tokens,
          completionTokens: groqUsage.completion_tokens,
          promptTokens: groqUsage.prompt_tokens,
          heliconeCalculated: false,
        };
      } else if (consolidatedData?.x_groq?.usage) {
        // Fallback to consolidated data if direct chunk search failed
        const groqUsage = consolidatedData.x_groq.usage;
        usage = {
          totalTokens: groqUsage.total_tokens,
          completionTokens: groqUsage.completion_tokens,
          promptTokens: groqUsage.prompt_tokens,
          heliconeCalculated: false,
        };
      } else {
        // Fallback to regular usage field
        const chunkWithUsage = data.find(
          (chunk) => chunk && typeof chunk === "object" && chunk.usage
        );

        if (chunkWithUsage?.usage) {
          const regularUsage = chunkWithUsage.usage;
          usage = {
            totalTokens: regularUsage.total_tokens,
            completionTokens: regularUsage.completion_tokens,
            promptTokens: regularUsage.prompt_tokens,
            heliconeCalculated: false,
          };
        } else if (consolidatedData.usage) {
          usage = {
            totalTokens: consolidatedData.usage.total_tokens,
            completionTokens: consolidatedData.usage.completion_tokens,
            promptTokens: consolidatedData.usage.prompt_tokens,
            heliconeCalculated: false,
          };
        } else {
          // If no usage data found, log this and return empty usage
          usage = {
            totalTokens: -1,
            completionTokens: -1,
            promptTokens: -1,
            heliconeCalculated: true,
            heliconeError: "No usage data found in Groq stream response",
          };
        }
      }

      return ok({
        processedBody: {
          ...consolidatedData,
          streamed_data: data,
        },
        usage: usage,
      });
    } catch (e) {
      console.error(`Error parsing Groq stream response: ${e}`);
      return ok({
        processedBody: {
          streamed_data: data,
        },
        usage: undefined,
      });
    }
  }
}
