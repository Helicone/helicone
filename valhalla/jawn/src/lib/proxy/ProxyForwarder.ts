import { Provider } from "../../models/models";
import { RequestWrapper } from "../requestWrapper/requestWrapper";
import { HeliconeProxyRequestMapper } from "./HeliconeProxyRequest";
import { checkRateLimit } from "./RateLimiter";
import { ResponseBuilder } from "./ResponseBuilder";

export async function proxyForwarder(
  request: RequestWrapper,
  provider: Provider
): Promise<Response> {
  const { data: proxyRequest, error: proxyRequestError } =
    await new HeliconeProxyRequestMapper(request, provider).tryToProxyRequest();

  if (proxyRequestError !== null) {
    return new Response(proxyRequestError, {
      status: 500,
    });
  }
  const responseBuilder = new ResponseBuilder();

  if (proxyRequest.rateLimitOptions) {
    if (!proxyRequest.providerAuthHash) {
      return new Response("Authorization header required for rate limiting", {
        status: 401,
      });
    }

    const rateLimitCheckResult = await checkRateLimit({
      providerAuthHash: proxyRequest.providerAuthHash,
      heliconeProperties: proxyRequest.heliconeProperties,
      rateLimitOptions: proxyRequest.rateLimitOptions,
      userId: proxyRequest.userId,
      cost: 0,
    });

    responseBuilder.addRateLimitHeaders(
      rateLimitCheckResult,
      proxyRequest.rateLimitOptions
    );
    if (rateLimitCheckResult.status === "rate_limited") {
      return responseBuilder.buildRateLimitedResponse();
    }
  }

  // TODO: ADD CACHING
  //   const { data: cacheSettings, error: cacheError } = getCacheSettings(
  //     proxyRequest.requestWrapper.getHeaders(),
  //     proxyRequest.isStream
  //   );

  //   if (cacheError !== null) {
  //     return responseBuilder.build({
  //       body: cacheError,
  //       status: 500,
  //     });
  //   }

  //   if (cacheSettings.shouldReadFromCache) {
  //     const { data: auth, error: authError } = await request.auth();
  //     if (authError == null) {
  //       const db = new DBWrapper(env, auth);
  //       const { data: orgData, error: orgError } = await db.getAuthParams();
  //       if (orgError !== null || !orgData?.organizationId) {
  //         console.error("Error getting org", orgError);
  //       } else {
  //         try {
  //           const cachedResponse = await getCachedResponse(
  //             proxyRequest,
  //             cacheSettings.bucketSettings,
  //             env.CACHE_KV,
  //             cacheSettings.cacheSeed
  //           );
  //           if (cachedResponse) {
  //             ctx.waitUntil(
  //               recordCacheHit(
  //                 cachedResponse.headers,
  //                 env,
  //                 new ClickhouseClientWrapper(env),
  //                 orgData.organizationId,
  //                 provider,
  //                 (request.cf?.country as string) ?? null
  //               )
  //             );
  //             return cachedResponse;
  //           }
  //         } catch (error) {
  //           console.error("Error getting cached response", error);
  //         }
  //       }
  //     }
  //   }

  const { data, error } = await handleProxyRequest(proxyRequest);
  if (error !== null) {
    return responseBuilder.build({
      body: error,
      status: 500,
    });
  }
  const { loggable, response } = data;

  if (cacheSettings.shouldSaveToCache && response.status === 200) {
    const { data: auth, error: authError } = await request.auth();
    if (authError == null) {
      const db = new DBWrapper(env, auth);
      const { data: orgData, error: orgError } = await db.getAuthParams();
      if (orgError !== null || !orgData?.organizationId) {
        console.error("Error getting org", orgError);
      } else {
        ctx.waitUntil(
          loggable
            .waitForResponse()
            .then((responseBody) =>
              saveToCache(
                proxyRequest,
                response,
                responseBody.body,
                cacheSettings.cacheControl,
                cacheSettings.bucketSettings,
                env.CACHE_KV,
                cacheSettings.cacheSeed ?? null
              )
            )
        );
      }
    }
  }

  response.headers.forEach((value, key) => {
    responseBuilder.setHeader(key, value);
  });

  if (cacheSettings.shouldReadFromCache) {
    responseBuilder.setHeader("Helicone-Cache", "MISS");
  }

  async function log(loggable: DBLoggable) {
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
          ),
          createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
        ),
        kafkaProducer: new KafkaProducer(env),
      },
      env.S3_ENABLED ?? "true",
      proxyRequest?.requestWrapper.heliconeHeaders
    );

    if (res.error !== null) {
      console.error("Error logging", res.error);
    }
  }

  if (request?.heliconeHeaders?.heliconeAuth || request.heliconeProxyKeyId) {
    ctx.waitUntil(log(loggable));
  }

  return responseBuilder.build({
    body: response.body,
    inheritFrom: response,
    status: response.status,
  });

  function parseLatestMessage(
    proxyRequest: HeliconeProxyRequest
  ): Result<LatestMessage, string> {
    try {
      return {
        error: null,
        data: JSON.parse(
          proxyRequest.bodyText ?? ""
        ).messages.pop() as LatestMessage,
      };
    } catch (error) {
      console.error("Error parsing latest message:", error);
      return {
        error: "Failed to parse the latest message.",
        data: null,
      };
    }
  }
}

type LatestMessage = {
  role?: string;
  content?: string;
};
