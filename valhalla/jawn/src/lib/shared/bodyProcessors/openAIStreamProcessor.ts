import { consolidateTextFields } from "../../../utils/streamParser";
import { getTokenCountGPT3 } from "../../tokens/tokenCounter";
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
      .filter((line) => line !== "")
      .filter((line) => !NON_DATA_LINES.includes(line));

    const data = lines.map((line, i) => {
      if (i === lines.length - 1) return {};
      try {
        return JSON.parse(line.replace("data:", ""));
      } catch (e) {
        console.log("Error parsing line OpenAI", line);
        return err({ msg: `Error parsing line`, line });
      }
    });

    try {
      const consolidatedData = consolidateTextFields(data);

      const usage =
        "usage" in consolidatedData
          ? consolidatedData.usage
          : await getUsage(
              data,
              requestBody,
              consolidatedData?.model ?? tryModel(requestBody ?? "{}") ?? ""
            );

      return ok({
        processedBody: {
          ...consolidatedData,
          streamed_data: data,
        },
        usage: {
          totalTokens: usage?.total_tokens,
          completionTokens: usage?.completion_tokens,
          promptTokens: usage?.prompt_tokens,
          heliconeCalculated: usage?.helicone_calculated ?? false,
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

export async function getUsage(
  streamedData: any[],
  requestBody: any,
  model: string
): Promise<{
  total_tokens: number;
  completion_tokens: number;
  prompt_tokens: number;
  helicone_calculated: boolean;
}> {
  try {
    const responseTokenCount = await getTokenCountGPT3(
      streamedData
        .filter((d) => "id" in d)
        .map((d) => getResponseText(d))
        .join(""),
      model
    );
    const requestTokenCount = await getRequestTokenCount(
      JSON.parse(requestBody),
      model
    );
    const totalTokens = requestTokenCount + responseTokenCount;
    return {
      total_tokens: totalTokens,
      completion_tokens: responseTokenCount,
      prompt_tokens: requestTokenCount,
      helicone_calculated: true,
    };
  } catch (e) {
    console.error("Error getting usage", e);
    return {
      total_tokens: -1,
      completion_tokens: -1,
      prompt_tokens: -1,
      helicone_calculated: false,
    };
  }
}

function getResponseText(responseBody: any): string {
  type Choice =
    | {
        delta: {
          content: string;
        };
      }
    | {
        text: string;
      };
  if (responseBody.choices !== undefined) {
    const choices = responseBody.choices;
    return (choices as Choice[])
      .map((c) => {
        if ("delta" in c) {
          return c.delta.content;
        } else if ("text" in c) {
          return c.text;
        } else {
          throw new Error("Invalid choice type");
        }
      })
      .join("");
  } else {
    throw new Error(`Invalid response body:\n${JSON.stringify(responseBody)}`);
  }
}

async function getRequestTokenCount(
  requestBody: any,
  model: string
): Promise<number> {
  if (requestBody.prompt !== undefined) {
    const prompt = requestBody.prompt;
    if (typeof prompt === "string") {
      return getTokenCountGPT3(requestBody.prompt, model);
    } else if ("length" in prompt) {
      return getTokenCountGPT3((prompt as string[]).join(""), model);
    } else {
      throw new Error("Invalid prompt type");
    }
  } else if (requestBody.messages !== undefined) {
    const messages = requestBody.messages as { content: string }[];

    let totalTokenCount = 0;

    for (const message of messages) {
      const tokenCount = await getTokenCountGPT3(message.content, model);
      totalTokenCount += tokenCount;
    }

    return totalTokenCount + 3 + messages.length * 5;
  } else {
    throw new Error(`Invalid request body:\n${JSON.stringify(requestBody)}`);
  }
}
