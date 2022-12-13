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
  body: string
): Promise<Response> {
  let url = new URL(request.url);
  const new_url = new URL(`https://api.openai.com${url.pathname}`);
  return fetch(new_url.href, {
    method: request.method,
    headers: request.headers,
    body,
  });
}

async function logRequest(
  dbClient: SupabaseClient,
  request: Request,
  userId: string | null,
  body: string,
  auth: string
): Promise<Result> {
  const json = JSON.parse(body);
  const { data, error } = await dbClient
    .from("request")
    .insert([
      {
        path: request.url,
        body: json,
        auth_hash: await hash(auth),
        user_id: userId,
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

function valyrHeaders(requestResult: Result): Record<string, string> {
  if (requestResult.error !== null) {
    return {
      "Valyr-Error": requestResult.error,
      "Valyr-Status": "error",
    };
  } else {
    return { "Valyr-Status": "success", "Valyr-Id": requestResult.data };
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
      return new Response("Not authorization header found!", { status: 401 });
    }

    const body = await request.text();
    const dbClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const [response, requestResult] = await Promise.all([
      forwardRequestToOpenAi(request, body),
      logRequest(dbClient, request, request.headers.get("User-Id"), body, auth),
    ]);
    const responseBody = await response.text();
    if (requestResult.data !== null) {
      ctx.waitUntil(logResponse(dbClient, requestResult.data, responseBody));
    }

    return new Response(responseBody, {
      ...response,
      headers: {
        ...valyrHeaders(requestResult),
        ...response.headers,
      },
    });
  },
};
