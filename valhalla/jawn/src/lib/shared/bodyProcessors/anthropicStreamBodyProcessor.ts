import { calculateModel } from "../../../utils/modelMapper";
import { consolidateTextFields } from "../../../utils/streamParser";
import { getTokenCountAnthropic } from "../../tokens/tokenCounter";
import { PromiseGenericResult, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";
import { isParseInputJson } from "./helpers";

const ALLOWED_LINES = [
  "content_block_delta",
  "message_delta",
  "message_start",
  "content_block_start",
  "content_block_stop",
  "message_stop",
  "ping",
];

export class AnthropicStreamBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput
  ): PromiseGenericResult<ParseOutput> {
    if (isParseInputJson(parseInput)) {
      return ok({
        processedBody: JSON.parse(parseInput.responseBody),
      });
    }

    const { responseBody, requestBody, requestModel, modelOverride } =
      parseInput;
    const model = calculateModel(requestModel, undefined, modelOverride);

    // Store the original response body for later use
    const originalResponseBody = responseBody;

    // Parse each line of the response body
    const eventLines = responseBody.split("\n");
    const processedLines = [];

    // Store input_json_delta fragments by content block index
    const jsonDeltaMap: Record<number, string> = {};

    for (let i = 0; i < eventLines.length; i++) {
      const line = eventLines[i];
      if (line === "") continue;

      // Process data lines

      try {
        const data = JSON.parse(line.replace("data:", "").trim());

        // Handle input_json_delta for tool_use
        if (
          data.type === "content_block_delta" &&
          data.delta?.type === "input_json_delta" &&
          data.delta?.partial_json !== undefined
        ) {
          // Initialize if first fragment for this index
          if (!jsonDeltaMap[data.index]) {
            jsonDeltaMap[data.index] = "";
          }

          // Concatenate partial JSON fragments
          jsonDeltaMap[data.index] += data.delta.partial_json;
        }

        processedLines.push(data);
      } catch (e) {
        const cleanedLine = line
          .replace("data:", "")
          .replace("event:", "")
          .trim();
        if (!ALLOWED_LINES.includes(cleanedLine)) {
          console.error("Error parsing line Anthropic", line);
        }
      }
    }

    // Parse JSON fragments at the end of processing all lines
    for (const [index, jsonString] of Object.entries(jsonDeltaMap)) {
      if (jsonString) {
        try {
          // Try to parse the consolidated JSON string
          const jsonObj = JSON.parse(jsonString);

          // Add a special item to indicate the complete JSON
          processedLines.push({
            type: "consolidated_json",
            index: Number(index),
            json: jsonObj,
          });
        } catch (e) {
          console.error(
            `Error parsing consolidated JSON for index ${index}:`,
            e
          );
          // Add unparsed string for debugging
          processedLines.push({
            type: "consolidated_json_error",
            index: Number(index),
            json_string: jsonString,
          });
        }
      }
    }

    try {
      if (
        model?.includes("claude-3") ||
        model?.includes("claude-sonnet-4") ||
        model?.includes("claude-opus-4") ||
        // for AI SDK
        model?.includes("claude-4")
      ) {
        const processedBody = {
          ...processConsolidatedJsonForClaude3(processedLines),
          // Store the original response body
          streamed_data: originalResponseBody,
        };

        if (
          !processedBody?.usage?.output_tokens ||
          !processedBody?.usage?.input_tokens
        ) {
          return ok({
            processedBody: processedBody,
          });
        } else {
          return ok({
            processedBody: processedBody,
            usage: {
              totalTokens:
                processedBody?.usage?.input_tokens +
                processedBody?.usage?.output_tokens,
              promptTokens: processedBody?.usage?.input_tokens,
              promptCacheWriteTokens:
                processedBody?.usage?.cache_creation_input_tokens,
              promptCacheReadTokens:
                processedBody?.usage?.cache_read_input_tokens,
              completionTokens: processedBody?.usage?.output_tokens,
              promptCacheWrite5m:
                processedBody?.usage?.cache_creation?.ephemeral_5m_input_tokens,
              promptCacheWrite1h:
                processedBody?.usage?.cache_creation?.ephemeral_1h_input_tokens,
              heliconeCalculated: true,
            },
          });
        }
      } else {
        const claudeData = {
          ...processedLines[processedLines.length - 1],
          completion: processedLines.map((d) => d.completion).join(""),
        };
        const completionTokens = await getTokenCountAnthropic(
          claudeData.completion
        );
        const promptTokens = await getTokenCountAnthropic(
          JSON.parse(requestBody ?? "{}")?.prompt ?? ""
        );
        return ok({
          processedBody: {
            ...consolidateTextFields(processedLines),
            streamed_data: originalResponseBody,
          },
          usage: {
            totalTokens: completionTokens + promptTokens,
            promptTokens: promptTokens,
            completionTokens: completionTokens,
            heliconeCalculated: true,
          },
        });
      }
    } catch (e) {
      console.error("Error parsing response", e);
      return ok({
        processedBody: {
          streamed_data: originalResponseBody,
        },
        usage: undefined,
      });
    }
  }
}

/**
 * Process the array of events and consolidate JSON fragments
 * to create a coherent response body structure.
 */
function processConsolidatedJsonForClaude3(events: any[]): any {
  // Initialize the accumulator
  const acc: any = {};

  // First pass - process message_start and other main events
  for (const item of events) {
    if (typeof item !== "object" || item === null) continue;

    if (item.type === "message_start" && item.message) {
      Object.assign(acc, item.message);
    } else if (item.type === "message_delta" && item.delta) {
      // Apply deltas to the accumulator
      Object.entries(item.delta).forEach(([key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
      });
      // accurate token count is in final message delta
      if (item.usage) {
        acc.usage = {
          ...acc.usage,
          output_tokens: (item.usage as any).output_tokens,
        };
      }
    } else if (item.type === "content_block_start" && item.content_block) {
      // Initialize content array if needed
      if (!acc.content) {
        acc.content = [];
      }

      // Make sure the content array is long enough
      while (acc.content.length <= item.index) {
        acc.content.push({});
      }

      // Add the new content block
      acc.content[item.index] = { ...item.content_block };
    }
  }

  // Handle tool_use content with input_json_delta
  for (const item of events) {
    if (typeof item !== "object" || item === null) continue;

    if (item.type === "consolidated_json" && typeof item.index === "number") {
      if (!acc.content || acc.content.length <= item.index) continue;

      const contentBlock = acc.content[item.index];
      if (contentBlock.type === "tool_use") {
        // Add the consolidated JSON as input
        contentBlock.input = item.json;
      }
    }
  }

  // Process text deltas
  for (const item of events) {
    if (typeof item !== "object" || item === null) continue;

    if (
      item.type === "content_block_delta" &&
      item.delta?.type === "text_delta" &&
      typeof item.index === "number"
    ) {
      if (!acc.content || acc.content.length <= item.index) continue;

      const contentBlock = acc.content[item.index];
      if (contentBlock.type === "text") {
        // Append text delta
        contentBlock.text = (contentBlock.text || "") + (item.delta.text || "");
      }
    }
  }

  return acc;
}

// This function is no longer used but kept for reference
function recursivelyConsolidateAnthropicListForClaude3(delta: any[]): any {
  return delta.reduce((acc, item) => {
    if (Array.isArray(item)) {
      return recursivelyConsolidateAnthropicListForClaude3(item);
    }
    if (typeof item !== "object") {
      return item;
    }

    if (Object.keys(item).length === 0) {
      return acc;
    }
    if (item.type === "message_delta") {
      return recursivelyConsolidateAnthropic(acc, {
        ...item.delta,
        ...item,
        type: undefined,
      });
    }

    if (item.type === "ping") {
      return acc;
    }

    if (item.type === "content_block_start") {
      return acc;
    }

    if (item.type === "content_block_stop") {
      return acc;
    }

    if (item.type === "content_block_delta") {
      recursivelyConsolidateAnthropic(acc, {
        content: [
          {
            type: "text",
            text: item.delta.text,
          },
        ],
      });
    }

    if (item.type === "message_start") {
      return recursivelyConsolidateAnthropic(acc, item.message);
    }

    // console.log("Item Without Ignore Keys", item);

    return recursivelyConsolidateAnthropic(acc, item);
  }, {});
}

// This function is no longer used but kept for reference
function recursivelyConsolidateAnthropic(body: any, delta: any): any {
  Object.keys(delta).forEach((key) => {
    if (key === "stop_reason") {
      // console.log("Stop Reason", delta[key]);
    }
    if (key === "delta") {
    } else if (key === "type") {
      body[key] = delta[key];
    } else if (body[key] === undefined || body[key] === null) {
      body[key] = delta[key];
    } else if (typeof body[key] === "object") {
      body[key] = recursivelyConsolidateAnthropic(body[key], delta[key]);
    } else if (typeof body[key] === "number") {
      body[key] += delta[key];
    } else if (typeof body[key] === "string") {
      body[key] += delta[key];
    } else {
      throw new Error("Invalid");
    }
  });
  return body;
}
