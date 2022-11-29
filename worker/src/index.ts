import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
  return { data: "THis is a UUID", error: null };
}

async function logResponse(
  dbClient: SupabaseClient,
  requestId: string,
  response: Response
): Promise<void> {
  console.log("Logging id");
  await new Promise((f) => setTimeout(f, 1500));
  console.log("LOgged!", requestId);
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
    const [requestId, response] = await Promise.all([
      logRequest(dbClient, request, body),
      forwardRequestToOpenAi(request, body),
    ]);

    ctx.waitUntil(logResponse(dbClient, requestId.data!, response));
    return new Response(response.body, {
      ...response,
      headers: { requestId: requestId.data!, ...response.headers },
    });
  },
};
