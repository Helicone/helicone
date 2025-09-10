import { createClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { DBWrapper, HeliconeAuth } from "../../lib/db/DBWrapper";
import { RequestWrapper } from "../../lib/RequestWrapper";
import { ClickhouseClientWrapper } from "../../lib/db/ClickhouseWrapper";
import { Valhalla } from "../../lib/db/valhalla";
import { RequestResponseStore } from "../../lib/db/RequestResponseStore";
import { DBQueryTimer } from "../../lib/util/loggers/DBQueryTimer";
import { InternalResponse } from "./internalResponse";

export class APIClient {
  public queue: RequestResponseStore;
  public response: typeof InternalResponse;
  db: DBWrapper;

  constructor(
    private env: Env,
    private ctx: ExecutionContext,
    private requestWrapper: RequestWrapper,
    auth: HeliconeAuth
  ) {
    this.response = InternalResponse;
    this.db = new DBWrapper(env, auth);
    this.queue = new RequestResponseStore(
      createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
      new DBQueryTimer(ctx, {
        enabled: (env.DATADOG_ENABLED ?? "false") === "true",
        apiKey: env.DATADOG_API_KEY,
        endpoint: env.DATADOG_ENDPOINT,
      }),
      new Valhalla(env.VALHALLA_URL, auth),
      new ClickhouseClientWrapper(env),
      env.FALLBACK_QUEUE,
      env.REQUEST_AND_RESPONSE_QUEUE_KV
    );
  }
}

export async function createAPIClient(
  env: Env,
  ctx: ExecutionContext,
  requestWrapper: RequestWrapper
) {
  const auth = await requestWrapper.auth();
  if (auth.error !== null) {
    throw new Error(auth.error);
  }
  return new APIClient(env, ctx, requestWrapper, auth.data);
}
