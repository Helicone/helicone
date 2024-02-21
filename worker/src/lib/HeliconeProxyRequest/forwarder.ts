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

  if (
    request.headers.get("Helicone-Prompt-Security-Enabled") &&
    provider === "OPENAI"
  ) {
    let latestMessage;

    try {
      latestMessage = JSON.parse(request["cachedText"] ?? "").messages.pop();
    } catch (error) {
      console.error("Error parsing latest message:", error);
      return responseBuilder.build({
        body: "Failed to parse the latest message.",
        status: 500,
      });
    }

    if (
      request.url.pathname.includes("chat/completions") &&
      latestMessage.role === "user" &&
      latestMessage
    ) {
      const threat = await checkPromptSecurity(
        latestMessage.content,
        provider.toLowerCase(),
        env
      );
      proxyRequest.threat = threat;

      const { data, error } = await handleThreatProxyRequest(proxyRequest);

      if (error !== null) {
        return responseBuilder.build({
          body: error,
          status: 500,
        });
      }
      const { loggable, response } = data;

      if (proxyRequest.threat === true) {
        response.headers.forEach((value, key) => {
          responseBuilder.setHeader(key, value);
        });

        const responseContent = {
          body: "Prompt threat detected.",
          inheritFrom: response,
          status: 400,
        };
        ctx.waitUntil(log(loggable));

        return responseBuilder.build(responseContent);
      }
    }
  }

  // TODO move this to proxyRequest
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
