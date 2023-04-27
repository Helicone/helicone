/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import GPT3Tokenizer from "gpt3-tokenizer";
import { RequestSettings } from ".";
import { Database } from "../supabase/database.types";
import { mapPostgrestErr, Result } from "./results";
export interface ResponseLog {
  requestSettings: RequestSettings;
  responseText: string;
  requestId: string;
  dbClient: SupabaseClient<Database>;
  requestBody: any;
  responseStatus: number;
  startTime: Date;
  wasTimeout: boolean;
}

async function getTokenCount(inputText: string): Promise<number> {
  const tokenizer = new GPT3Tokenizer({ type: "gpt3" }); // or 'codex'
  const encoded: { bpe: number[]; text: string[] } =
    tokenizer.encode(inputText);
  return encoded.bpe.length;
}

function getRequestString(requestBody: any): [string, number] {
  if (requestBody.prompt !== undefined) {
    const prompt = requestBody.prompt;
    if (typeof prompt === "string") {
      return [requestBody.prompt, 0];
    } else if ("length" in prompt) {
      return [(prompt as string[]).join(""), 0];
    } else {
      throw new Error("Invalid prompt type");
    }
  } else if (requestBody.messages !== undefined) {
    const messages = requestBody.messages as { content: string }[];

    return [messages.map((m) => m.content).join(""), 3 + messages.length * 5];
  } else {
    throw new Error(`Invalid request body:\n${JSON.stringify(requestBody)}`);
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

function consolidateTextFields(responseBody: any[]): any {
  try {
    const consolidated = responseBody.reduce((acc, cur) => {
      if (!cur) {
        return acc;
      } else if (acc.choices === undefined) {
        return cur;
      } else {
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

async function getUsage(
  streamedData: any[],
  requestBody: any
): Promise<{
  total_tokens: number;
  completion_tokens: number;
  prompt_tokens: number;
  helicone_calculated: boolean;
}> {
  try {
    const responseTokenCount = await getTokenCount(
      streamedData
        .filter((d) => "id" in d)
        .map((d) => getResponseText(d))
        .join("")
    );
    const [requestString, paddingTokenCount] = getRequestString(
      JSON.parse(requestBody)
    );
    const requestTokenCount =
      (await getTokenCount(requestString)) + paddingTokenCount;
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

async function parseResponse(
  requestSettings: RequestSettings,
  responseBody: string,
  responseStatus: number,
  requestBody: any
): Promise<Result<any, string>> {
  const result = responseBody;
  try {
    if (!requestSettings.stream || responseStatus !== 200) {
      return {
        data: JSON.parse(result),
        error: null,
      };
    } else {
      const lines = result.split("\n").filter((line) => line !== "");
      const data = lines.map((line, i) => {
        if (i === lines.length - 1) return {};
        return JSON.parse(line.replace("data:", ""));
      });

      try {
        return {
          data: {
            ...consolidateTextFields(data),
            streamed_data: data,
            usage: await getUsage(data, requestBody),
          },
          error: null,
        };
      } catch (e) {
        console.error("Error parsing response", e);
        return {
          data: {
            streamed_data: data,
          },
          error: null,
        };
      }
    }
  } catch (e) {
    return {
      data: null,
      error: "error parsing response, " + e + ", " + result,
    };
  }
}

async function initialResponseLog({
  dbClient,
  requestId,
  startTime,
}: ResponseLog) {
  return dbClient
    .from("response")
    .insert([
      {
        request: requestId,
        delay_ms: new Date().getTime() - startTime.getTime(),
        body: {},
        status: -1,
      },
    ])
    .select("*")
    .single();
}

export async function readAndLogResponse(
  responseLog: ResponseLog
): Promise<Result<Database["public"]["Tables"]["response"]["Row"], string>> {
  const {
    requestSettings,
    responseText,
    requestId,
    dbClient,
    requestBody,
    responseStatus,
  } = responseLog;
  const initialResponse = mapPostgrestErr(
    await initialResponseLog(responseLog)
  );

  if (initialResponse.error !== null) {
    return initialResponse;
  }

  const parsedResponse = await parseResponse(
    requestSettings,
    responseText,
    responseStatus,
    requestBody
  );

  if (parsedResponse.error === null) {
    return mapPostgrestErr(
      await dbClient
        .from("response")
        .update({
          request: requestId,
          body: parsedResponse.data,
          status: responseStatus,
          completion_tokens: parsedResponse.data.usage?.completion_tokens,
          prompt_tokens: parsedResponse.data.usage?.prompt_tokens,
        })
        .eq("id", initialResponse.data.id)
        .select("*")
        .single()
    );
  } else {
    return parsedResponse;
  }
}
