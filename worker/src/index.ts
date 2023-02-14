import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { extractPrompt, Prompt } from "./prompt_discovery";
// import bcrypt from "bcrypt";
export interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
}

interface SuccessResult {
  data: string;
  error: null;
}
interface ErrorResult {
  data: null;
  error: string;
}

type Result = SuccessResult | ErrorResult;

function forwardRequestToOpenAi(
  request: Request,
  body?: string
): Promise<Response> {
  let url = new URL(request.url);
  const new_url = new URL(`https://api.openai.com${url.pathname}`);
  return request.method === "GET"
    ? fetch(new_url.href, {
        method: request.method,
        headers: request.headers,
      })
    : fetch(new_url.href, {
        method: request.method,
        headers: request.headers,
        body,
      });
}

async function getPromptId(
  dbClient: SupabaseClient,
  prompt: Prompt
): Promise<Result> {
  // First, get the prompt id if there's a match in the prompt table
  const { data, error } = await dbClient
    .from("prompt")
    .select("id")
    .eq("prompt", prompt.prompt)
    .limit(1);
  if (error !== null) {
    return { data: null, error: error.message }; 
  }
  if (data !== null && data.length > 0) {
    return { data: data[0].id, error: null };
  } else {
    // If there's no match, insert the prompt and get the id
    const { data, error } = await dbClient
      .from("prompt")
      .insert([{ prompt: prompt.prompt }])
      .select("id")
      .single();
    if (error !== null) {
      return { data: null, error: error.message };
    }
    return { data: data.id, error: null };
  }
}

async function logRequest({
  dbClient,
  request,
  userId,
  promptId,
  requestId,
  auth,
  body,
  prompt,
  properties,
}: {
  dbClient: SupabaseClient;
  request: Request;
  userId: string | null;
  promptId: string | null;
  requestId?: string;
  auth: string;
  body?: string;
  prompt?: Prompt;
  properties?: Record<string, string>;
}): Promise<Result> {
  const json = body ? JSON.parse(body) : {};

  const formattedPromptResult = prompt !== undefined ? await getPromptId(dbClient, prompt) : null;
  if (formattedPromptResult !== null && formattedPromptResult.error !== null) {
    return { data: null, error: formattedPromptResult.error };
  }
  const formattedPromptId = formattedPromptResult !== null ? formattedPromptResult.data : null;

  const prompt_values = prompt !== undefined ? prompt.values : null;

  const { data, error } = requestId
    ? await dbClient
        .from("request")
        .insert([
          {
            id: requestId,
            path: request.url,
            body: json,
            auth_hash: await hash(auth),
            user_id: userId,
            prompt_id: promptId,
            formatted_prompt_id: formattedPromptId,
            prompt_values: prompt_values,
            properties: properties,
          },
        ])
        .select("id")
        .single()
    : await dbClient
        .from("request")
        .insert([
          {
            path: request.url,
            body: json,
            auth_hash: await hash(auth),
            user_id: userId,
            prompt_id: promptId,
            formatted_prompt_id: formattedPromptId,
            prompt_values: prompt_values,
            properties: properties,
          },
        ])
        .select("id")
        .single();

  

  if (error !== null) {
    return { data: null, error: error.message };
  } else {
    return { data: data.id, error: null };
  }
}

async function logResponse(
  dbClient: SupabaseClient,
  requestId: string,

  body: string
): Promise<void> {
  const { data, error } = await dbClient
    .from("response")
    .insert([{ request: requestId, body: JSON.parse(body) }])
    .select("id");
  if (error !== null) {
    console.error(error);
  }
}

function heliconeHeaders(requestResult: Result): Record<string, string> {
  if (requestResult.error !== null) {
    console.error(requestResult.error);
    return {
      "Helicone-Error": requestResult.error,
      "Helicone-Status": "error",
    };
  } else {
    return { "Helicone-Status": "success", "Helicone-Id": requestResult.data };
  }
}
async function hash(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashedKey = await crypto.subtle.digest(
    { name: "SHA-256" },
    encoder.encode(key)
  );
  const byteArray = Array.from(new Uint8Array(hashedKey));
  const hexCodes = byteArray.map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, "0");
    return paddedHexCode;
  });
  return hexCodes.join("");
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const auth = request.headers.get("Authorization");
    if (auth === null) {
      return new Response("No authorization header found!", { status: 401 });
    }

    const {
      request: formattedRequest, 
      body, 
      prompt,
    } = await extractPrompt(request);

    const dbClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const properties = Object.fromEntries(
      [...request.headers.entries()].filter(([key, _]) =>
        key.startsWith("helicone-property-") && key.length > 18
      ).map(([key, value]) => [key.substring(18), value])
    );

    const [response, requestResult] = await Promise.all([
      forwardRequestToOpenAi(formattedRequest, body),
      logRequest({
        dbClient,
        request,
        userId:
          formattedRequest.headers.get("Helicone-User-Id")?.substring(0, 128) ??
          formattedRequest.headers.get("User-Id")?.substring(0, 128) ??
          null,
        promptId:
          formattedRequest.headers.get("Helicone-Prompt-Id")?.substring(0, 128) ?? null,
        requestId: formattedRequest.headers
          .get("Helicone-Request-Id")
          ?.substring(0, 128),
        auth,
        body: body === "" ? undefined : body,
        prompt,
        properties: Object.keys(properties).length === 0 ? undefined : properties,
      }),
    ]);
    const responseBody = await response.text();
    if (requestResult.data !== null) {
      ctx.waitUntil(logResponse(dbClient, requestResult.data, responseBody));
    }

    return new Response(responseBody, {
      ...response,
      headers: {
        ...heliconeHeaders(requestResult),
        ...response.headers,
      },
    });
  },
};
