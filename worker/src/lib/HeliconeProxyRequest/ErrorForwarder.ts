import { createClient } from "@supabase/supabase-js";
import { gatewayForwarder } from "../../routers/gatewayRouter";
import {
  DBLoggable,
  dbLoggableRequestFromProxyRequest,
} from "../dbLogger/DBLoggable";
import { HeliconeProxyRequestMapper } from "../models/HeliconeProxyRequest";
import { RequestWrapper } from "../RequestWrapper";
import { ResponseBuilder } from "../ResponseBuilder";
import { CacheSettings } from "../util/cache/cacheSettings";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { RequestResponseStore } from "../db/RequestResponseStore";
import { DBQueryTimer } from "../util/loggers/DBQueryTimer";
import { DBWrapper } from "../db/DBWrapper";
import { Valhalla } from "../db/valhalla";
import { RequestResponseManager } from "../managers/RequestResponseManager";
import { S3Client } from "../clients/S3Client";
import { HeliconeProducer } from "../clients/producers/HeliconeProducer";
import { AttemptError } from "../ai-gateway/types";

export async function errorForwarder(
  request: RequestWrapper,
  env: Env,
  ctx: ExecutionContext,
  error: {
    code: string;
    message: string;
    details?: Array<AttemptError>;
    statusCode?: number;
  }
) {
  const responseBuilder = new ResponseBuilder();
  const { data: proxyRequest, error: proxyRequestError } =
    await new HeliconeProxyRequestMapper(
      request,
      "CUSTOM",
      env
    ).tryToProxyRequest();
  const responseContent = {
    body: JSON.stringify({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        param: null,
      },
    }),
    status: error.statusCode ?? 500,
  };
  const response = responseBuilder
    .setHeader("content-type", "application/json")
    .build(responseContent);

  if (proxyRequestError !== null) {
    return response;
  }

  const errorResponse = {
    data: {
      loggable: new DBLoggable({
        request: dbLoggableRequestFromProxyRequest(proxyRequest, new Date()),
        response: {
          responseId: crypto.randomUUID(),
          getResponseBody: async () => ({
            body: [
              JSON.stringify({
                success: false,
                error: {
                  code: error.code,
                  message: error.message,
                  details: error.details,
                },
              }),
            ],
            endTime: new Date(),
          }),
          status: async () => error.statusCode ?? 500,
          responseHeaders: new Headers(),
          omitLog: false,
        },
        timing: {
          startTime: proxyRequest.startTime,
          timeToFirstToken: async () => null,
        },
        tokenCalcUrl: proxyRequest.tokenCalcUrl,
      }),
      response: new Response(
        JSON.stringify({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            param: null,
          },
        }),
        {
          status: error.statusCode ?? 500,
        }
      ),
    },
  };

  ctx.waitUntil(
    log(errorResponse.data.loggable, env.S3_ENABLED, false, response, undefined)
  );

  return errorResponse.data.response;

  async function log(
    loggable: DBLoggable,
    S3_ENABLED?: Env["S3_ENABLED"],
    incurRateLimit = true,
    cachedResponse?: Response,
    cacheSettings?: CacheSettings
  ) {
    const { data: auth, error: authError } = await request.auth();

    if (authError !== null) {
      console.error("Error getting auth", authError);
      return;
    }
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    const res = await loggable.log(
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
            env.S3_BUCKET_NAME ?? "",
            env.S3_REGION ?? "us-west-2"
          )
        ),
        producer: new HeliconeProducer(env),
      },
      S3_ENABLED ?? env.S3_ENABLED ?? "true",
      proxyRequest?.requestWrapper.heliconeHeaders,
      cachedResponse ? cachedResponse.headers : undefined,
      cacheSettings ?? undefined
    );

    if (res.error !== null) {
      console.error("Error logging", res.error);
    }
  }
}
