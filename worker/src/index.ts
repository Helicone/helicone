import { createClient, SupabaseClient } from "@supabase/supabase-js";
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
  const headers = removeHeliconeHeaders(request.headers);
  const method = request.method;
  const baseInit = { method, headers };
  const init = method === "GET" ? { ...baseInit } : { ...baseInit, body };
  return fetch(new_url.href, init);
}

type HeliconeRequest = {
  dbClient: SupabaseClient;
  request: Request;

  auth: string;
  body?: string;
} & HeliconeHeaders;

interface HeliconeHeaders {
  requestId: string;
  userId: string | null;
  promptId: string | null;
  properties?: Record<string, string>;
}

async function logRequest({
  dbClient,
  request,
  userId,
  promptId,
  requestId,
  auth,
  body,
  properties,
}: HeliconeRequest): Promise<Result> {
  try {
    const json = body ? JSON.parse(body) : {};

    const { data, error } = await dbClient
      .from("request")
      .insert([
        {
          id: requestId,
          path: request.url,
          body: json,
          auth_hash: await hash(auth),
          user_id: userId,
          prompt_id: promptId,
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
  } catch (e) {
    return { data: null, error: JSON.stringify(e) };
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

function getHeliconeHeaders(headers: Headers): HeliconeHeaders {
  const propTag = "helicone-property-";
  const properties = Object.fromEntries(
    [...headers.entries()]
      .filter(
        ([key, _]) => key.startsWith(propTag) && key.length > propTag.length
      )
      .map(([key, value]) => [key.substring(propTag.length), value])
  );
  return {
    userId:
      headers.get("Helicone-User-Id")?.substring(0, 128) ??
      headers.get("User-Id")?.substring(0, 128) ??
      null,
    promptId: headers.get("Helicone-Prompt-Id")?.substring(0, 128) ?? null,
    requestId:
      headers.get("Helicone-Request-Id")?.substring(0, 128) ??
      crypto.randomUUID(),
    properties: Object.keys(properties).length === 0 ? undefined : properties,
  };
}

function removeHeliconeHeaders(request: Headers): Headers {
  const newHeaders = new Headers();
  for (const [key, value] of request.entries()) {
    if (!key.startsWith("Helicone-")) {
      newHeaders.set(key, value);
    }
  }
  return newHeaders;
}

async function forwardAndLog(
  body: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const auth = request.headers.get("Authorization");
  if (auth === null) {
    return new Response("No authorization header found!", { status: 401 });
  }

  const dbClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const [response, requestResult] = await Promise.all([
    forwardRequestToOpenAi(request, body),
    logRequest({
      dbClient,
      request,
      auth,
      body: body === "" ? undefined : body,
      ...getHeliconeHeaders(request.headers),
    }),
  ]);
  const responseBody = await response.text();
  if (requestResult.data !== null) {
    ctx.waitUntil(logResponse(dbClient, requestResult.data, responseBody));
  } else {
    console.error(requestResult.error);
  }

  return new Response(responseBody, {
    ...response,
    headers: {
      ...heliconeHeaders(requestResult),
      ...response.headers,
    },
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const body = await request.text();
    return await forwardAndLog(body, request, env, ctx);
  },
};
