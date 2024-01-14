import { createClient } from "@supabase/supabase-js";
import { Env } from "../..";
import { Database } from "../../../supabase/database.types";
import { DBWrapper, HeliconeAuth } from "../../db/DBWrapper";
import { RequestWrapper } from "../../lib/RequestWrapper";
import { ClickhouseClientWrapper } from "../../lib/db/clickhouse";
import { Valhalla } from "../../lib/db/valhalla";
import { InsertQueue } from "../../lib/dbLogger/insertQueue";

class InternalResponse {
  constructor(private client: APIClient) {}

  newError(message: string, status: number): Response {
    console.error(`Response Error: `, message);
    return new Response(JSON.stringify({ error: message }), { status });
  }

  successJSON(data: unknown, enableCors = false): Response {
    if (enableCors) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "content-type": "application/json;charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT",
          "Access-Control-Allow-Headers":
            "Content-Type, helicone-jwt, helicone-org-id",
        },
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    });
  }

  unauthorized(): Response {
    return this.newError("Unauthorized", 401);
  }
}

class APIClient {
  public queue: InsertQueue;
  public response: InternalResponse;
  db: DBWrapper;
  private heliconeApiKeyRow?: Database["public"]["Tables"]["helicone_api_keys"]["Row"];

  constructor(
    private env: Env,
    private requestWrapper: RequestWrapper,
    auth: HeliconeAuth
  ) {
    this.response = new InternalResponse(this);
    this.db = new DBWrapper(env, auth);
    this.queue = new InsertQueue(
      createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
      new Valhalla(env.VALHALLA_URL, auth),
      new ClickhouseClientWrapper(env),
      env.FALLBACK_QUEUE,
      env.REQUEST_AND_RESPONSE_QUEUE_KV
    );
  }
}

export async function createAPIClient(
  env: Env,
  requestWrapper: RequestWrapper
) {
  const auth = await requestWrapper.auth();
  if (auth.error !== null) {
    throw new Error(auth.error);
  }
  return new APIClient(env, requestWrapper, auth.data);
}
