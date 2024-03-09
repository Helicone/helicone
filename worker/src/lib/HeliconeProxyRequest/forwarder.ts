import { createClient } from "@supabase/supabase-js";
import { Env, Provider } from "../..";
import { DBWrapper } from "../../db/DBWrapper";
import { checkRateLimit, updateRateLimitCounter } from "../../rateLimit";
import { RequestWrapper } from "../RequestWrapper";
import { ResponseBuilder } from "../ResponseBuilder";
import {
  getCachedResponse,
  recordCacheHit,
  saveToCache,
} from "../cache/cacheFunctions";
import { getCacheSettings } from "../cache/cacheSettings";
import { ClickhouseClientWrapper } from "../db/clickhouse";
import { InsertQueue } from "../dbLogger/insertQueue";

import { Valhalla } from "../db/valhalla";
import { handleProxyRequest, handleThreatProxyRequest } from "./handler";
import { HeliconeProxyRequestMapper } from "./mapper";
import { checkPromptSecurity } from "../security/promptSecurity";
import { DBLoggable } from "../dbLogger/DBLoggable";

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

  // Moved above prompt threat detection
  // TODO move this to proxyRequest (old comment)
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
              orgData.organizationId
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
    let latestMessage;

    try {
      latestMessage = JSON.parse(proxyRequest.bodyText ?? "").messages.pop();
    } catch (error) {
      console.error("Error parsing latest message:", error);
      return responseBuilder.build({
        body: "Failed to parse the latest message.",
        status: 500,
      });
    }

    if (
      request.url.pathname.includes("chat/completions") &&
      latestMessage &&
      latestMessage.role === "user"
    ) {
      const threat = await checkPromptSecurity(
        latestMessage.content,
        provider,
        env
      );

      proxyRequest.threat = threat;
      if (threat === true) {
        const { data, error } = await handleThreatProxyRequest(proxyRequest);

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
              details: "See your Helicone request page for more info.",
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
    let latestMessage;

    try {
      latestMessage = JSON.parse(proxyRequest.bodyText ?? "").messages.pop();
    } catch (error) {
      console.error("Error parsing latest message:", error);
      return responseBuilder.build({
        body: "Failed to parse the latest message.",
        status: 500,
      });
    }

    if (latestMessage.role == "user") {
      const moderationRequest = new Request(
        "https://api.openai.com/v1/moderations",
        {
          method: "POST",
          headers: proxyRequest.requestWrapper.headers,
          body: JSON.stringify({
            input: latestMessage.content,
          }),
        }
      );

      const moderationRequestWrapper = await RequestWrapper.create(
        moderationRequest,
        env
      );
      if (moderationRequestWrapper.error || !moderationRequestWrapper.data) {
        return responseBuilder.build({
          body: moderationRequestWrapper.error,
          status: 500,
        });
      }

      const {
        data: moderationProxyRequest,
        error: moderationProxyRequestError,
      } = await new HeliconeProxyRequestMapper(
        moderationRequestWrapper.data,
        provider,
        env
      ).tryToProxyRequest();

      if (moderationProxyRequestError !== null) {
        return responseBuilder.build({
          body: moderationProxyRequestError,
          status: 500,
        });
      }

      const { data: moderationResponse, error: moderationResponseError } =
        await handleProxyRequest(moderationProxyRequest);
      if (moderationResponseError != null) {
        return responseBuilder.build({
          body: moderationResponseError,
          status: 500,
        });
      }

      const flaggedForModeration = (
        (await moderationResponse.response.json()) as OpenAIModerationResponse
      ).results[0].flagged;
      proxyRequest.flaggedForModeration = flaggedForModeration;
      ctx.waitUntil(log(moderationResponse.loggable));

      if (flaggedForModeration == true) {
        moderationResponse.response.headers.forEach((value, key) => {
          responseBuilder.setHeader(key, value);
        });

        const responseContent = {
          body: JSON.stringify({
            success: false,
            error: {
              code: "PROMPT_FLAGGED_FOR_MODERATION",
              message:
                "The given prompt was flagged by the OpenAI Moderation endpoint.",
              details: `See your Helicone request page for more info: https://www.helicone.ai/requests?${moderationProxyRequest.requestId}`,
            },
          }),
          inheritFrom: moderationResponse.response,
          status: 400,
        };

        return responseBuilder
          .setHeader("content-type", "application/json")
          .build(responseContent);
      }
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
    const res = await loggable.log({
      clickhouse: new ClickhouseClientWrapper(env),
      supabase: createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
      dbWrapper: new DBWrapper(env, auth),
      queue: new InsertQueue(
        createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY),
        new Valhalla(env.VALHALLA_URL, auth),
        new ClickhouseClientWrapper(env),
        env.FALLBACK_QUEUE,
        env.REQUEST_AND_RESPONSE_QUEUE_KV
      ),
    });

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
}

type OpenAIModerationResponse = {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: object;
    category_scores: object;
  }>;
};
