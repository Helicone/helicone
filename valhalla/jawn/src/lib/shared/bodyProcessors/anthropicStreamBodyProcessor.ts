import { calculateModel } from "../../../utils/modelMapper";
import { consolidateTextFields } from "../../../utils/streamParser";
import { getTokenCountAnthropic } from "../../tokens/tokenCounter";
import { PromiseGenericResult, ok } from "../result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";
import { isParseInputJson } from "./helpers";
import { NON_DATA_LINES } from "./openAIStreamProcessor";

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
    const lines = responseBody
      .split("\n")
      .filter((line) => line !== "")
      .filter((line) => !NON_DATA_LINES.includes(line))
      .map((line) => {
        try {
          return JSON.parse(line.replace("data:", ""));
        } catch (e) {
          console.error("Error parsing line Anthropic", line);
          return {};
        }
      })
      .filter((line) => line !== null);

    try {
      if (model?.includes("claude-3")) {
        const processedBody = {
          ...recursivelyConsolidateAnthropicListForClaude3(lines),
          streamed_data: responseBody,
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
              promptCacheWriteTokens: processedBody?.usage?.cache_creation_input_tokens,
              promptCacheReadTokens: processedBody?.usage?.cache_read_input_tokens,
              completionTokens: processedBody?.usage?.output_tokens,
              heliconeCalculated: true,
            },
          });
        }
      } else {
        const claudeData = {
          ...lines[lines.length - 1],
          completion: lines.map((d) => d.completion).join(""),
        };
        const completionTokens = await getTokenCountAnthropic(
          claudeData.completion
        );
        const promptTokens = await getTokenCountAnthropic(
          JSON.parse(requestBody ?? "{}")?.prompt ?? ""
        );
        return ok({
          processedBody: {
            ...consolidateTextFields(lines),
            streamed_data: responseBody,
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
          streamed_data: responseBody,
        },
        usage: undefined,
      });
    }
  }
}

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
