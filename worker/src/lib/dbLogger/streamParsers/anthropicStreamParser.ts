/* eslint-disable @typescript-eslint/no-explicit-any */
import { Result, ok } from "../../util/results";
import { consolidateTextFields } from "./responseParserHelpers";

export function recursivelyConsolidateAnthropic(body: any, delta: any): any {
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

export function recursivelyConsolidateAnthropicListForClaude(
  delta: any[]
): any {
  return delta.reduce((acc, item) => {
    if (Array.isArray(item)) {
      return recursivelyConsolidateAnthropicListForClaude(item);
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
      // Store content block metadata for server_tool_use and tool_use blocks
      if (item.content_block?.type === "server_tool_use" || item.content_block?.type === "tool_use") {
        recursivelyConsolidateAnthropic(acc, {
          content: [
            {
              type: item.content_block.type,
              id: item.content_block.id,
              name: item.content_block.name,
              input: item.content_block.input || {},
            },
          ],
        });
      }
      return acc;
    }

    if (item.type === "content_block_stop") {
      return acc;
    }

    if (item.type === "content_block_delta") {
      // Handle different types of content block deltas
      if (item.delta?.text !== undefined) {
        recursivelyConsolidateAnthropic(acc, {
          content: [
            {
              type: "text",
              text: item.delta.text,
            },
          ],
        });
      } else if (item.delta?.partial_json !== undefined) {
        // Handle tool_use or server_tool_use input deltas
        recursivelyConsolidateAnthropic(acc, {
          content: [
            {
              type: item.content_block?.type || "tool_use",
              input: item.delta.partial_json,
            },
          ],
        });
      }
    }

    if (item.type === "message_start") {
      return recursivelyConsolidateAnthropic(acc, item.message);
    }

    return recursivelyConsolidateAnthropic(acc, item);
  }, {});
}

export function getModel(requestBody: string): string {
  try {
    return JSON.parse(requestBody)?.model;
  } catch (e) {
    return "unknown";
  }
}

export async function anthropicAIStream(
  result: string
): Promise<Result<any, string>> {
  const lines = result
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => {
      try {
        return JSON.parse(line.replace("data:", ""));
      } catch (e) {
        console.error("Error parsing line", line);
        return {};
      }
    })
    .filter((line) => line !== null);

  try {
    return ok({
      ...recursivelyConsolidateAnthropicListForClaude(lines),
    });
  } catch (e) {
    console.error("Error parsing response", e);
    return {
      data: {
        streamed_data: result,
      },
      error: null,
    };
  }
}
