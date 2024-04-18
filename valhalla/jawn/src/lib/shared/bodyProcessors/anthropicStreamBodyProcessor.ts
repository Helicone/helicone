import { PromiseGenericResult, ok } from "../../modules/result";
import { IBodyProcessor, ParseInput } from "./IBodyProcessor";

export class AnthropicStreamBodyProcessor implements IBodyProcessor {
  public async parse(parseInput: ParseInput): PromiseGenericResult<any> {
    const { responseBody, requestBody, model, tokenCounter } = parseInput;

    const lines = responseBody
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
      if (model?.includes("claude-3")) {
        return ok({
          ...recursivelyConsolidateAnthropicListForClaude3(lines),
          streamed_data: responseBody,
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
          streamed_data: responseBody,
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
      return ok({
        streamed_data: responseBody,
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

function recursivelyConsolidateAnthropic(body: any, delta: any): any {
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

function consolidateTextFields(responseBody: any[]): any {
  try {
    const consolidated = responseBody.reduce((acc, cur) => {
      if (!cur) {
        return acc;
      } else if (acc.choices === undefined) {
        return cur;
      } else {
        // This is to handle the case if the choices array is empty (happens on Azure)
        if (acc.choices.length === 0 && cur.choices?.length !== 0) {
          acc.choices.push(...cur.choices.slice(acc.choices.length));
        }
        return {
          ...acc,
          choices: acc.choices.map((c: any, i: number) => {
            if (!cur.choices) {
              return c;
            } else if (
              c.delta !== undefined &&
              cur.choices[i]?.delta !== undefined
            ) {
              return {
                delta: {
                  ...c.delta,
                  content: c.delta.content
                    ? c.delta.content + (cur.choices[i].delta.content ?? "")
                    : cur.choices[i].delta.content,
                  function_call: c.delta.function_call
                    ? recursivelyConsolidate(
                        c.delta.function_call,
                        cur.choices[i].delta.function_call ?? {}
                      )
                    : cur.choices[i].delta.function_call,
                },
              };
            } else if (
              c.text !== undefined &&
              cur.choices[i]?.text !== undefined
            ) {
              return {
                ...c,
                text: c.text + (cur.choices[i].text ?? ""),
              };
            } else {
              return c;
            }
          }),
        };
      }
    }, {});

    consolidated.choices = consolidated.choices.map((c: any) => {
      if (c.delta !== undefined) {
        return {
          ...c,
          // delta: undefined,
          message: {
            ...c.delta,
            content: c.delta.content,
          },
        };
      } else {
        return c;
      }
    });
    return consolidated;
  } catch (e) {
    console.error("Error consolidating text fields", e);
    return responseBody[0];
  }
}

export function recursivelyConsolidate(body: any, delta: any): any {
  Object.keys(delta).forEach((key) => {
    if (body[key] === undefined) {
      body[key] = delta[key];
    } else if (typeof body[key] === "object") {
      recursivelyConsolidate(body[key], delta[key]);
    } else if (typeof body[key] === "number") {
      body[key] += delta[key];
    } else if (typeof body[key] === "string") {
      body[key] += delta[key];
    } else {
      throw new Error("Invalid function call type");
    }
  });
  return body;
}
