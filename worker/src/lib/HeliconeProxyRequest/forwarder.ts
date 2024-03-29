import { createClient } from "@supabase/supabase-js";
import { Env, Provider } from "../..";
import { DBWrapper } from "../db/DBWrapper";
import { checkRateLimit, updateRateLimitCounter } from "../../rateLimit";
import { RequestWrapper } from "../RequestWrapper";
import { ResponseBuilder } from "../ResponseBuilder";
import {
  getCachedResponse,
  recordCacheHit,
  saveToCache,
} from "../util/cache/cacheFunctions";
import { getCacheSettings } from "../util/cache/cacheSettings";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { RequestResponseStore } from "../db/RequestResponseStore";
import { Valhalla } from "../db/valhalla";
import { handleProxyRequest, handleThreatProxyRequest } from "./handler";
import { HeliconeProxyRequest, HeliconeProxyRequestMapper } from "./mapper";
import { checkPromptSecurity } from "../clients/PromptSecurityClient";
import { DBLoggable } from "../dbLogger/DBLoggable";
import { DBQueryTimer } from "../db/DBQueryTimer";
import { Moderator } from "../managers/ModerationManager";
import { Result } from "../../results";
import { S3Client } from "../clients/S3Client";

export async function proxyForwarder(
  request: RequestWrapper,
  env: Env,
  ctx: ExecutionContext,
  provider: Provider
): Promise<Response> {
  const { data: proxyRequest, error: proxyRequestError } =
    await new HeliconeProxyRequestMapper(
      request,
      provider,
      env
    ).tryToProxyRequest();

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
      rateLimitKV: env.RATE_LIMIT_KV,
      rateLimitOptions: proxyRequest.rateLimitOptions,
      userId: proxyRequest.userId,
    });

    responseBuilder.addRateLimitHeaders(
      rateLimitCheckResult,
      proxyRequest.rateLimitOptions
    );
    if (rateLimitCheckResult.status === "rate_limited") {
      return responseBuilder.buildRateLimitedResponse();
    }
  }

  const { data: cacheSettings, error: cacheError } = getCacheSettings(
    proxyRequest.requestWrapper.getHeaders(),
    proxyRequest.isStream
  );

  if (cacheError !== null) {
    return responseBuilder.build({
      body: cacheError,
      status: 500,
    });
  }

  if (cacheSettings.shouldReadFromCache) {
    const { data: auth, error: authError } = await request.auth();
    if (authError == null) {
      const db = new DBWrapper(env, auth);
      const { data: orgData, error: orgError } = await db.getAuthParams();
      if (orgError !== null || !orgData?.organizationId) {
        console.error("Error getting org", orgError);
      } else {
        const cachedResponse = await getCachedResponse(
          proxyRequest,
          cacheSettings.bucketSettings,
          env.CACHE_KV,
          cacheSettings.cacheSeed
        );
        if (cachedResponse) {
          ctx.waitUntil(
            recordCacheHit(
              cachedResponse.headers,
              env,
              new ClickhouseClientWrapper(env),
              orgData.organizationId,
              provider,
              (request.cf?.country as string) ?? null
            )
          );
          return cachedResponse;
        }
      }
    }
  }

  if (
    proxyRequest.requestWrapper.heliconeHeaders.promptSecurityEnabled &&
    provider === "OPENAI" &&
    env.PROMPTARMOR_API_KEY
  ) {
    const { data: latestMsg, error: latestMsgErr } =
      parseLatestMessage(proxyRequest);
    if (latestMsgErr || !latestMsg) {
      return responseBuilder.build({
        body: latestMsgErr,
        status: 500,
      });
    }

    if (
      request.url.pathname.includes("chat/completions") &&
      latestMsg?.content &&
      latestMsg?.role === "user"
    ) {
      const requestStartTime = new Date();
      const threat = await checkPromptSecurity(
        latestMsg.content,
        provider,
        env
      );

      proxyRequest.threat = threat;
      if (threat === true) {
        const { data, error } = await handleThreatProxyRequest(
          proxyRequest,
          requestStartTime
        );

        if (error !== null) {
          return responseBuilder.build({
            body: error,
            status: 500,
          });
        }
        const { loggable, response } = data;

        response.headers.forEach((value, key) => {
          responseBuilder.setHeader(key, value);
        });

        ctx.waitUntil(log(loggable));

        const responseContent = {
          body: JSON.stringify({
            success: false,
            error: {
              code: "PROMPT_THREAT_DETECTED",
              message:
                "Prompt threat detected. Your request cannot be processed.",
              details: `See your Helicone request page for more info. https://helicone.ai/request/${proxyRequest.requestId}`,
            },
          }),
          inheritFrom: response,
          status: 400,
        };

        return responseBuilder
          .setHeader("content-type", "application/json")
          .build(responseContent);
      }
    }
  }

  if (
    proxyRequest.requestWrapper.heliconeHeaders.moderationsEnabled &&
    provider == "OPENAI"
  ) {
    const { data: latestMsg, error: latestMsgErr } =
      parseLatestMessage(proxyRequest);

    if (latestMsgErr || !latestMsg) {
      return responseBuilder.build({
        body: latestMsgErr,
        status: 500,
      });
    }

    if (
      request.url.pathname.includes("chat/completions") &&
      latestMsg?.content &&
      latestMsg?.role === "user"
    ) {
      const moderator = new Moderator(
        proxyRequest.requestWrapper.headers,
        env,
        provider
      );

      const { data: moderationRes, error: moderationErr } =
        await moderator.moderate(latestMsg.content);

      if (moderationErr || !moderationRes) {
        return responseBuilder.build({
          body: moderationErr,
          status: 500,
        });
      }

      ctx.waitUntil(log(moderationRes.loggable));

      if (moderationRes.isModerated) {
        return moderationRes.response;
      }
      // Passed moderation...
    }
  }

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
    const res = await loggable.log(
      {
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
        s3Client: new S3Client(
          env.S3_ACCESS_KEY ?? "",
          env.S3_SECRET_KEY ?? "",
          env.S3_ENDPOINT ?? "",
          env.S3_BUCKET_NAME ?? ""
        ),
      },
      env.S3_ENABLED ?? "true"
    );

    if (res.error !== null) {
      console.error("Error logging", res.error);
    }
  }

  if (request?.heliconeHeaders?.heliconeAuth || request.heliconeProxyKeyId) {
    ctx.waitUntil(log(loggable));
  }

  if (proxyRequest.rateLimitOptions) {
    if (!proxyRequest.providerAuthHash) {
      return new Response("Authorization header required for rate limiting", {
        status: 401,
      });
    }
    updateRateLimitCounter({
      providerAuthHash: proxyRequest.providerAuthHash,
      heliconeProperties:
        proxyRequest.requestWrapper.heliconeHeaders.heliconeProperties,
      rateLimitKV: env.RATE_LIMIT_KV,
      rateLimitOptions: proxyRequest.rateLimitOptions,
      userId: proxyRequest.userId,
    });
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
