import { consolidateTextFields } from "../../../utils/streamParser";
import { PromiseGenericResult, err, ok } from "../../modules/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

export class OpenAIStreamProcessor implements IBodyProcessor {
  async parse(parseInput: ParseInput): PromiseGenericResult<ParseOutput> {
    const { responseBody, requestBody, tokenCounter } = parseInput;
    const lines = responseBody.split("\n").filter((line) => line !== "");
    const data = lines.map((line, i) => {
      if (i === lines.length - 1) return {};
      try {
        return JSON.parse(line.replace("data:", ""));
      } catch (e) {
        console.log("Error parsing line", line);
        return err(`Error parsing line`);
      }
    });

    try {
      const usage = await getUsage(data, requestBody, tokenCounter);

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
      console.log("Error parsing response", e);
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
  tokenCounter: (text: string) => Promise<number>
): Promise<{
  total_tokens: number;
  completion_tokens: number;
  prompt_tokens: number;
  helicone_calculated: boolean;
}> {
  try {
    const responseTokenCount = await tokenCounter(
      streamedData
        .filter((d) => "id" in d)
        .map((d) => getResponseText(d))
        .join("")
    );
    const requestTokenCount = await getRequestTokenCount(
      JSON.parse(requestBody),
      tokenCounter
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
  tokenCounter: (text: string) => Promise<number>
): Promise<number> {
  if (requestBody.prompt !== undefined) {
    const prompt = requestBody.prompt;
    if (typeof prompt === "string") {
      return tokenCounter(requestBody.prompt);
    } else if ("length" in prompt) {
      return tokenCounter((prompt as string[]).join(""));
    } else {
      throw new Error("Invalid prompt type");
    }
  } else if (requestBody.messages !== undefined) {
    const messages = requestBody.messages as { content: string }[];

    let totalTokenCount = 0;

    for (const message of messages) {
      const tokenCount = await tokenCounter(message.content);
      totalTokenCount += tokenCount;
    }

    return totalTokenCount + 3 + messages.length * 5;
  } else {
    throw new Error(`Invalid request body:\n${JSON.stringify(requestBody)}`);
  }
}
