import { createClient } from "@supabase/supabase-js";
import { Env, Provider } from "../..";
import { DBWrapper } from "../../db/DBWrapper";
import { HeliconeHeaders } from "../../lib/HeliconeHeaders";
import { RequestWrapper } from "../../lib/RequestWrapper";
import { ClickhouseClientWrapper } from "../../lib/db/clickhouse";
import { Valhalla } from "../../lib/db/valhalla";
import { dbLoggableRequestFromAsyncLogModel } from "../../lib/dbLogger/DBLoggable";
import { RequestResponseStore } from "../../lib/dbLogger/RequestResponseStore";
import {
  AsyncLogModel,
  validateAsyncLogModel,
} from "../../lib/models/AsyncLog";
import { DBQueryTimer } from "../../db/DBQueryTimer";
import { S3Client } from "../../db/S3Client";

export async function logAsync(
  requestWrapper: RequestWrapper,
  env: Env,
  ctx: ExecutionContext,
  provider: Provider
): Promise<Response> {
  const asyncLogModel = await requestWrapper.getJson<AsyncLogModel>();
  // if payload is larger than 10MB, return 400
  const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024;
  if (JSON.stringify(asyncLogModel).length > MAX_PAYLOAD_SIZE) {
    return new Response("Payload too large", { status: 400 });
  }
  if (!requestWrapper.getAuthorization()) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [isValid, error] = validateAsyncLogModel(asyncLogModel);
  if (!isValid) {
    console.error("Invalid asyncLogModel", error);
    return new Response(JSON.stringify({ error }), { status: 400 });
  }

  const requestHeaders = new Headers(asyncLogModel.providerRequest.meta);
  const responseHeaders = new Headers(asyncLogModel.providerResponse.headers);
  const heliconeHeaders = new HeliconeHeaders(requestHeaders);

  const loggable = await dbLoggableRequestFromAsyncLogModel({
    requestWrapper,
    env,
    asyncLogModel,
    providerRequestHeaders: heliconeHeaders,
    providerResponseHeaders: responseHeaders,
    provider: provider,
  });

  const { data: auth, error: authError } = await requestWrapper.auth();
  if (authError !== null) {
    return new Response(JSON.stringify({ error: authError }), {
      status: 401,
    });
  }
  const { error: logError } = await loggable.log({
    clickhouse: new ClickhouseClientWrapper(env),
    supabase: createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
    dbWrapper: new DBWrapper(env, auth),
    queue: new RequestResponseStore(
      createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
      new DBQueryTimer(ctx, {
        apiKey: env.DATADOG_API_KEY,
        endpoint: env.DATADOG_ENDPOINT,
      }),
      new Valhalla(env.VALHALLA_URL, auth),
      new ClickhouseClientWrapper(env),
      env.FALLBACK_QUEUE,
      env.REQUEST_AND_RESPONSE_QUEUE_KV
    ),
    s3Client: env.S3_ENABLED
      ? new S3Client(
          env.S3_ACCESS_KEY ?? "",
          env.S3_SECRET_KEY ?? "",
          env.S3_ENDPOINT ?? "",
          env.S3_BUCKET_NAME ?? ""
        )
      : undefined,
  });

  if (logError !== null) {
    return new Response(JSON.stringify({ error: logError }), {
      status: 200,
    });
  }

  return new Response("ok", {
    status: 200,
    headers: { "helicone-id": heliconeHeaders.requestId ?? "" },
  });
}
