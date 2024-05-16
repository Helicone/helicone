import { createClient } from "@supabase/supabase-js";
import { Env, Provider } from "../..";
import { DBWrapper } from "../db/DBWrapper";
import { HeliconeHeaders } from "../models/HeliconeHeaders";
import { RequestWrapper } from "../RequestWrapper";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { Valhalla } from "../db/valhalla";
import { dbLoggableRequestFromAsyncLogModel } from "../dbLogger/DBLoggable";
import { RequestResponseStore } from "../db/RequestResponseStore";
import { AsyncLogModel, validateAsyncLogModel } from "../models/AsyncLog";
import { DBQueryTimer } from "../util/loggers/DBQueryTimer";
import { S3Client } from "../clients/S3Client";
import { RequestResponseManager } from "./RequestResponseManager";
import { KafkaProducer } from "../clients/KafkaProducer";

export async function logAsync(
  requestWrapper: RequestWrapper,
  env: Env,
  ctx: ExecutionContext,
  provider: Provider
): Promise<Response> {
  console.log(requestWrapper.heliconeHeaders.requestId);
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
  heliconeHeaders.heliconeAuthV2 =
    requestWrapper.heliconeHeaders.heliconeAuthV2;

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
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { error: logError } = await loggable.log(
    {
      clickhouse: new ClickhouseClientWrapper(env),
      supabase: supabase,
      dbWrapper: new DBWrapper(env, auth),
      queue: new RequestResponseStore(
        createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
        new DBQueryTimer(ctx, {
          enabled: (env.DATADOG_ENABLED ?? "false") === "true",
          apiKey: env.DATADOG_API_KEY,
          endpoint: env.DATADOG_ENDPOINT,
        }),
        new Valhalla(env.VALHALLA_URL, auth),
        new ClickhouseClientWrapper(env),
        env.FALLBACK_QUEUE,
        env.REQUEST_AND_RESPONSE_QUEUE_KV
      ),
      requestResponseManager: new RequestResponseManager(
        new S3Client(
          env.S3_ACCESS_KEY ?? "",
          env.S3_SECRET_KEY ?? "",
          env.S3_ENDPOINT ?? "",
          env.S3_BUCKET_NAME ?? ""
        ),
        createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
      ),
      kafkaProducer: new KafkaProducer(env),
    },
    env.S3_ENABLED ?? "true",
    env.ORG_IDS ?? "",
    env.PERCENT_LOG_KAFKA ?? "",
    heliconeHeaders
  );

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
