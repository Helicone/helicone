/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { Result } from "../../results";
import { ChatPrompt, Prompt } from "../promptFormater/prompt";
import { DBLoggableProps } from "./DBLoggable";
import { DatabaseExecutor } from "../db/postgres";

const MAX_USER_ID_LENGTH = 7000;

export async function initialResponseLog(
  { requestId }: DBLoggableProps["request"],
  { startTime, endTime }: DBLoggableProps["timing"],
  dbClient: SupabaseClient<Database>
) {
  return dbClient
    .from("response")
    .insert([
      {
        request: requestId,
        delay_ms: (endTime ?? new Date()).getTime() - startTime.getTime(),
        body: {},
        status: -1,
      },
    ])
    .select("*")
    .single();
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
  dbClient: SupabaseClient<Database>,
  postgres: DatabaseExecutor
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

    if (!request.heliconeApiKeyAuthHash) {
      return { data: null, error: "Missing heliconeApiKeyAuthHash" };
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
      return { data: null, error: userIdError };
    }

    if (!heliconeApiKeyRow?.organization_id) {
      return { data: null, error: "Helicone api key not found" };
    }

    let bodyText = request.bodyText ?? "{}";
    bodyText = bodyText.replace(/\\u0000/g, ""); // Remove unsupported null character in JSONB

    let requestBody = {
      error: `error parsing request body: ${bodyText}`,
    };
    try {
      requestBody = JSON.parse(bodyText ?? "{}");
    } catch (e) {
      console.error("Error parsing request body", e);
    }

    let truncatedUserId = request.userId ?? "";

    if (truncatedUserId.length > MAX_USER_ID_LENGTH) {
      truncatedUserId =
        truncatedUserId.substring(0, MAX_USER_ID_LENGTH) + "...";
    }

    const createdAt = new Date().toISOString();
    const requestData = {
      id: request.requestId,
      path: request.path,
      body: request.omitLog ? {} : requestBody,
      auth_hash: request.providerApiKeyAuthHash,
      user_id: request.userId ?? null,
      prompt_id: request.promptId ?? null,
      properties: request.properties,
      formatted_prompt_id: formattedPromptId,
      prompt_values: prompt_values,
      helicone_user: heliconeApiKeyRow?.user_id ?? null,
      helicone_api_key_id: heliconeApiKeyRow?.id ?? null,
      helicone_org_id: heliconeApiKeyRow?.organization_id ?? null,
      provider: request.provider,
      helicone_proxy_key_id: request.heliconeProxyKeyId ?? null,
      created_at: createdAt,
    };

    const { error } = await dbClient.from("request").insert([requestData]);

    const requestRow: Database["public"]["Tables"]["request"]["Row"] =
      requestData;

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
        data: { request: requestRow, properties: customProperties },
        error: null,
      };
    }
  } catch (e) {
    return { data: null, error: JSON.stringify(e) };
  }
}
