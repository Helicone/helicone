/* eslint-disable @typescript-eslint/no-explicit-any */
import { Result, ok } from "../../../results";
import { consolidateTextFields } from "./responseParserHelpers";

export function recursivelyConsolidateAnthropic(body: any, delta: any): any {
  Object.keys(delta).forEach((key) => {
    if (key === "stop_reason") {
      console.log("Stop Reason", delta[key]);
    }
    if (key === "delta") {
      console.log("Delta", delta[key]);
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

export function recursivelyConsolidateAnthropicListForClaude3(
  delta: any[]
): any {
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
      console.log("Message Delta", item);
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

export function getModel(requestBody: string): string {
  try {
    return JSON.parse(requestBody)?.model;
  } catch (e) {
    return "unknown";
  }
}

export async function anthropicAIStream(
  result: string,
  tokenCounter: (text: string) => Promise<number>,
  requestBody?: string
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
    if (getModel(requestBody ?? "{}").includes("claude-3")) {
      return ok({
        ...recursivelyConsolidateAnthropicListForClaude3(lines),
        streamed_data: result,
      });
    } else {
      const claudeData = {
        ...lines[lines.length - 1],
        completion: lines.map((d) => d.completion).join(""),
      };
      const completionTokens = await tokenCounter(claudeData.completion);
      const promptTokens = await tokenCounter(
        JSON.parse(requestBody ?? "{}")?.prompt ?? ""
      );
      return ok({
        ...consolidateTextFields(lines),
        streamed_data: result,
        usage: {
          total_tokens: completionTokens + promptTokens,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          helicone_calculated: true,
        },
      });
    }
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
