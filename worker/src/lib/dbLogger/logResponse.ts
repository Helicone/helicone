/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import GPT3Tokenizer from "gpt3-tokenizer";
import { Database } from "../../../supabase/database.types";
import { Result, mapPostgrestErr } from "../../results";
import { ChatPrompt, Prompt } from "../promptFormater/prompt";
import { DBLoggableProps } from "./DBLoggable";

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
  isStream: boolean,
  responseBody: string,
  responseStatus: number,
  requestBody: any
): Promise<Result<any, string>> {
  const result = responseBody;
  try {
    if (!isStream || responseStatus !== 200) {
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

async function initialResponseLog(
  { requestId, startTime }: DBLoggableProps["request"],
  dbClient: SupabaseClient<Database>
) {
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
  response: DBLoggableProps["response"],
  request: DBLoggableProps["request"],
  dbClient: SupabaseClient<Database>
): Promise<Result<Database["public"]["Tables"]["response"]["Row"], string>> {
  const responseBody = await response.getResponseBody();

  // Log delay
  const initialResponse = mapPostgrestErr(
    await initialResponseLog(request, dbClient)
  );

  if (initialResponse.error !== null) {
    return initialResponse;
  }

  const parsedResponse = await parseResponse(
    request.isStream,
    responseBody,
    response.status,
    request.bodyText
  );

  if (parsedResponse.error === null) {
    return mapPostgrestErr(
      await dbClient
        .from("response")
        .update({
          request: request.requestId,
          body: parsedResponse.data,
          status: response.status,
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

async function getPromptId(
  dbClient: SupabaseClient,
  prompt: Prompt | ChatPrompt,
  name: string | null,
  providerAuthHash: string
): Promise<Result<string, string>> {
  // First, get the prompt id if there's a match in the prompt table
  const { data, error } = await dbClient
    .from("prompt")
    .select("id")
    .eq("auth_hash", providerAuthHash)
    .eq("prompt", prompt.prompt)
    .limit(1);
  if (error !== null) {
    return { data: null, error: error.message };
  }
  if (data !== null && data.length > 0) {
    return { data: data[0].id, error: null };
  } else {
    let newPromptName;
    if (name) {
      newPromptName = name;
    } else {
      // First, query the database to find the highest prompt name suffix
      const { data: highestSuffixData } = await dbClient
        .from("prompt")
        .select("name")
        .order("name", { ascending: false })
        .like("name", "Prompt (%)")
        .eq("auth_hash", providerAuthHash)
        .limit(1)
        .single();

      // Extract the highest suffix number from the highest prompt name suffix found
      let highestSuffix = 0;
      if (highestSuffixData) {
        const matches = highestSuffixData.name.match(/\((\d+)\)/);
        if (matches) {
          highestSuffix = parseInt(matches[1]);
        }
      }

      // Increment the highest suffix to get the new suffix for the new prompt name
      const newSuffix = highestSuffix + 1;

      // Construct the new prompt name with the new suffix
      newPromptName = `Prompt (${newSuffix})`;
    }

    // If there's no match, insert the prompt and get the id
    const { data, error } = await dbClient
      .from("prompt")
      .insert([
        {
          id: crypto.randomUUID(),
          prompt: prompt.prompt,
          name: newPromptName,
          auth_hash: providerAuthHash,
        },
      ])
      .select("id")
      .single();
    if (error !== null) {
      return { data: null, error: error.message };
    }
    return { data: data.id, error: null };
  }
}

async function getHeliconeApiKeyRow(
  dbClient: SupabaseClient<Database>,
  heliconeApiKeyHash?: string
) {
  const { data, error } = await dbClient
    .from("helicone_api_keys")
    .select("*")
    .eq("api_key_hash", heliconeApiKeyHash)
    .eq("soft_delete", false)
    .single();

  if (error !== null) {
    return { data: null, error: error.message };
  }
  return { data: data, error: null };
}

export async function logRequest(
  request: DBLoggableProps["request"],
  dbClient: SupabaseClient<Database>
): Promise<
  Result<
    {
      request: Database["public"]["Tables"]["request"]["Row"];
      properties: Database["public"]["Tables"]["properties"]["Row"][];
    },
    string
  >
> {
  try {
    if (!request.providerApiKeyAuthHash) {
      return { data: null, error: "Missing providerApiKeyAuthHash" };
    }
    const prompt = request.promptFormatter?.prompt;
    const formattedPromptResult =
      prompt !== undefined
        ? await getPromptId(
            dbClient,
            prompt,
            request.promptFormatter?.name ?? "unknown",
            request.providerApiKeyAuthHash
          )
        : null;
    if (
      formattedPromptResult !== null &&
      formattedPromptResult.error !== null
    ) {
      return { data: null, error: formattedPromptResult.error };
    }
    const formattedPromptId =
      formattedPromptResult !== null ? formattedPromptResult.data : null;
    const prompt_values = prompt !== undefined ? prompt.values : null;

    const { data: heliconeApiKeyRow, error: userIdError } =
      await getHeliconeApiKeyRow(dbClient, request.heliconeApiKeyAuthHash);
    if (userIdError !== null) {
      console.error(userIdError);
    }

    // TODO - once we deprecate using OpenAI API keys, we can remove this
    // if (userIdError !== null) {
    //   return { data: null, error: userIdError };
    // }

    let requestBody = {
      error: `error parsing request body: ${request.bodyText}`,
    };
    try {
      requestBody = JSON.parse(request.bodyText);
    } catch (e) {
      console.error("Error parsing request body", e);
    }

    const { data, error } = await dbClient
      .from("request")
      .insert([
        {
          id: request.requestId,
          path: request.path,
          body: requestBody,
          auth_hash: request.providerApiKeyAuthHash,
          user_id: request.userId,
          prompt_id: request.promptId,
          properties: request.properties,
          formatted_prompt_id: formattedPromptId,
          prompt_values: prompt_values,
          helicone_user: heliconeApiKeyRow?.user_id,
          helicone_api_key_id: heliconeApiKeyRow?.id,
          helicone_org_id: heliconeApiKeyRow?.organization_id,
        },
      ])
      .select("*")
      .single();

    if (error !== null) {
      return { data: null, error: error.message };
    } else {
      // Log custom properties and then return request id
      const customPropertyRows = Object.entries(request.properties).map(
        (entry) => ({
          request_id: request.requestId,
          auth_hash: request.providerApiKeyAuthHash,
          user_id: null,
          key: entry[0],
          value: entry[1],
        })
      );

      const customProperties =
        customPropertyRows.length > 0
          ? (
              await dbClient
                .from("properties")
                .insert(customPropertyRows)
                .select("*")
            ).data ?? []
          : [];

      return {
        data: { request: data, properties: customProperties },
        error: null,
      };
    }
  } catch (e) {
    return { data: null, error: JSON.stringify(e) };
  }
}
