import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as argon2 from "argon2";

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
  body: string
): Promise<Result> {
  const json = JSON.parse(body);
  const { data, error } = await dbClient
    .from("request")
    .insert([{ path: request.url, body: json }])
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

async function createDbClient(env: Env, auth: string): Promise<SupabaseClient> {
  const dbClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${argon2.hash(auth)}`,
        },
      },
    }
  );
  return dbClient;
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

    const [body, dbClient] = await Promise.all([
      argon2.hash(auth),
      createDbClient(env, auth),
    ]);

    const [requestResult, response] = await Promise.all([
      logRequest(dbClient, request, body),
      forwardRequestToOpenAi(request, body),
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
