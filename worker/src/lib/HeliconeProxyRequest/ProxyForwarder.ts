/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import { Provider } from "@helicone-package/llm-mapper/types";
import { DBWrapper } from "../db/DBWrapper";
import {
  checkRateLimit,
  updateRateLimitCounter,
} from "../clients/KVRateLimiterClient";
import { RequestWrapper } from "../RequestWrapper";
import { ResponseBuilder } from "../ResponseBuilder";
import { getCachedResponse, saveToCache } from "../util/cache/cacheFunctions";
import { CacheSettings, getCacheSettings } from "../util/cache/cacheSettings";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { RequestResponseStore } from "../db/RequestResponseStore";
import { Valhalla } from "../db/valhalla";
import {
  handleProxyRequest,
  handleThreatProxyRequest,
} from "./ProxyRequestHandler";
import { checkPromptSecurity } from "../clients/PromptSecurityClient";
import { DBLoggable } from "../dbLogger/DBLoggable";
import { DBQueryTimer } from "../util/loggers/DBQueryTimer";
import { Moderator } from "../managers/ModerationManager";
import { Result } from "../util/results";
import { S3Client } from "../clients/S3Client";
import {
  HeliconeProxyRequestMapper,
  HeliconeProxyRequest,
} from "../models/HeliconeProxyRequest";
import { RequestResponseManager } from "../managers/RequestResponseManager";
import { HeliconeProducer } from "../clients/producers/HeliconeProducer";
import { RateLimitManager } from "../managers/RateLimitManager";
import { SentryManager } from "../managers/SentryManager";
import { StripeManager } from "../managers/StripeManager";
import { isError } from "../../../../packages/common/result";
import { EscrowInfo } from "../util/aiGateway";

export async function proxyForwarder(
  request: RequestWrapper,
  env: Env,
  ctx: ExecutionContext,
  provider: Provider,
  escrowInfo?: EscrowInfo
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

  const { data: cacheSettings, error: cacheError } = getCacheSettings(
    proxyRequest.requestWrapper.getHeaders()
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
      } else if (!orgData.accessDict.cache) {
        console.error(
          `Cache is disabled for this organization. ${orgData.organizationId}`
        );
      } else {
        try {
          const cachedResponse = await getCachedResponse(
            proxyRequest,
            cacheSettings.bucketSettings,
            env.CACHE_KV,
            cacheSettings.cacheSeed
          );
          if (cachedResponse) {
            const { data, error } = await handleProxyRequest(
              proxyRequest,
              cachedResponse // Pass the cached response directly
            );
            if (error !== null) {
              return responseBuilder.build({
                body: error,
                status: 500,
              });
            }
            const { loggable, response } = data;
            ctx.waitUntil(
              log(
                loggable,
                request,
                proxyRequest,
                env,
                ctx,
                "false", // S3_ENABLED
                cachedResponse,
                cacheSettings,
                escrowInfo
              )
            );

            return response;
          }
        } catch (error) {
          console.error("Error getting cached response", error);
        }
      }
    }
  }

  let rate_limited = false;
  let finalRateLimitOptions = proxyRequest.rateLimitOptions;
  if (finalRateLimitOptions || proxyRequest.isRateLimitedKey) {
    const { data: auth, error: authError } = await request.auth();
    if (authError === null) {
      const db = new DBWrapper(env, auth);
      const { data: orgData, error: orgError } = await db.getAuthParams();
      if (orgError === null && orgData?.organizationId) {
        if (!finalRateLimitOptions && proxyRequest.isRateLimitedKey) {
          const rateLimitManager = new RateLimitManager();
          const result = await rateLimitManager.getRateLimitOptionsForKey(
            db,
            proxyRequest.userId,
            proxyRequest.heliconeProperties
          );

          if (!result.error && result.data) {
            finalRateLimitOptions = result.data;
          } else if (result.error) {
            console.error(`[RateLimit] Manager error: ${result.error}`);
          }
        }

        if (finalRateLimitOptions) {
          const rateLimitCheckResult = await checkRateLimit({
            organizationId: orgData.organizationId,
            heliconeProperties: proxyRequest.heliconeProperties,
            rateLimitKV: env.RATE_LIMIT_KV,
            rateLimitOptions: finalRateLimitOptions,
            userId: proxyRequest.userId,
          });

          responseBuilder.addRateLimitHeaders(
            rateLimitCheckResult,
            finalRateLimitOptions
          );

          if (rateLimitCheckResult.status === "rate_limited") {
            rate_limited = true;
            request.injectCustomProperty(
              "Helicone-Rate-Limit-Status",
              rateLimitCheckResult.status
            );
          }
        }
      }
    }
  }

  if (
    proxyRequest.requestWrapper.heliconeHeaders.promptSecurityEnabled ===
      true &&
    provider === "OPENAI"
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
        env,
        proxyRequest.requestWrapper.heliconeHeaders.promptSecurityAdvanced
          ? true
          : false
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

        ctx.waitUntil(
          log(
            loggable,
            request,
            proxyRequest,
            env,
            ctx,
            undefined,
            undefined,
            undefined,
            escrowInfo
          )
        );

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

      ctx.waitUntil(
        log(
          moderationRes.loggable,
          request,
          proxyRequest,
          env,
          ctx,
          undefined,
          undefined,
          undefined,
          escrowInfo
        )
      );

      if (moderationRes.isModerated) {
        return moderationRes.response;
      }
      // Passed moderation...
    }
  }

  const { data, error } = await handleProxyRequest(
    proxyRequest,
    rate_limited ? responseBuilder.buildRateLimitedResponse() : undefined
  );
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
          loggable.waitForResponse().then(async (responseBody) => {
            const status = await loggable.getStatus();
            if (status >= 200 && status < 300) {
              try {
                const success = await saveToCache({
                  request: proxyRequest,
                  response,
                  responseBody: responseBody.body,
                  cacheControl: cacheSettings.cacheControl,
                  settings: cacheSettings.bucketSettings,
                  responseLatencyMs:
                    responseBody.endTime.getTime() - loggable.getTimingStart(),
                  cacheKv: env.CACHE_KV,
                  cacheSeed: cacheSettings.cacheSeed ?? null,
                });
                if (!success) {
                  const sentryManager = new SentryManager(env);
                  await sentryManager.sendError(
                    "Failed to save to cache",
                    "all retries failed"
                  );
                }
              } catch (error) {
                const sentryManager = new SentryManager(env);
                await sentryManager.sendError(
                  "Failed to save to cache",
                  error instanceof Error
                    ? error.stack ?? error.message
                    : String(error)
                );
                console.error("Failed to save to cache:", error);
              }
            }
          })
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

  if (
    request?.heliconeHeaders?.heliconeAuth ||
    request?.heliconeHeaders.heliconeAuthV2 ||
    request.heliconeProxyKeyId
  ) {
    ctx.waitUntil(
      log(
        loggable,
        request,
        proxyRequest,
        env,
        ctx,
        undefined,
        undefined,
        undefined,
        escrowInfo
      )
    );
  }

  return responseBuilder.build({
    body: response.body,
    inheritFrom: response,
    status: response.status,
  });
}

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

type LatestMessage = {
  role?: string;
  content?: string;
};

async function log(
  loggable: DBLoggable,
  request: RequestWrapper,
  proxyRequest: HeliconeProxyRequest,
  env: Env,
  ctx: ExecutionContext,
  S3_ENABLED?: Env["S3_ENABLED"],
  cachedResponse?: Response,
  cacheSettings?: CacheSettings,
  escrowInfo?: EscrowInfo
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
        ),
        createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
      ),
      producer: new HeliconeProducer(env),
    },
    S3_ENABLED ?? env.S3_ENABLED ?? "true",
    proxyRequest?.requestWrapper.heliconeHeaders,
    cachedResponse ? cachedResponse.headers : undefined,
    cacheSettings ?? undefined
  );
  const finalRateLimitOptions = proxyRequest.rateLimitOptions;

  if (res.error !== null) {
    console.error("Error logging", res.error);
  }
  const db = new DBWrapper(env, auth);
  const { data: orgData, error: orgError } = await db.getAuthParams();
  if (!orgData) {
    console.error(
      "Could not get org data for request w/ id: ",
      proxyRequest.requestId
    );
    return;
  }
  const walletId = env.WALLET.idFromName(orgData.organizationId);
  const walletStub = env.WALLET.get(walletId);
  const cloudBillingEnabled =
    proxyRequest?.requestWrapper.heliconeHeaders.cloudBillingEnabled;
  // finalize the escrow
  if (cloudBillingEnabled && res.data && escrowInfo && orgData.stripeCustomerId) {
    const stripeManager = new StripeManager(
      env.STRIPE_WEBHOOK_SECRET,
      env.STRIPE_SECRET_KEY,
      env.WALLET
    );
    
    const updateResult = await walletStub.updateBalanceIfNeeded(
      orgData.organizationId,
      orgData.stripeCustomerId,
      stripeManager
    );
    if (isError(updateResult)) {
      console.error("Error updating wallet balance", updateResult.error);
      // TODO: add alerts
    }
    
    const cost = res.data.cost;
    try {
      const result = await walletStub.finalizeEscrow(orgData.organizationId, escrowInfo.escrowId, cost);
      if (result.error) {
        console.error(
          `Failed to finalize escrow ${escrowInfo.escrowId}:`,
          result.error
        );
      }
    } catch (error) {
      console.error(`Error finalizing escrow ${escrowInfo.escrowId}:`, error);
    }
  } else if (cloudBillingEnabled) {
    if (!escrowInfo) {
      console.error("No escrow info, could not finalize escrow");
      // TODO: add alerts
    } else if (!orgData.stripeCustomerId) {
      console.error("No stripe customer id for org ", orgData.organizationId);
      await walletStub.addToDisallowList(proxyRequest.requestId);
    }
  }

  // if not a cached response, incur rate limits
  if (cachedResponse === undefined || cachedResponse === null) {
    if (proxyRequest && finalRateLimitOptions && !orgError) {
      try {
        await updateRateLimitCounter({
          organizationId: orgData?.organizationId,
          heliconeProperties:
            proxyRequest.requestWrapper.heliconeHeaders.heliconeProperties,
          rateLimitKV: env.RATE_LIMIT_KV,
          rateLimitOptions: finalRateLimitOptions,
          userId: proxyRequest.userId,
        });
      } catch (error) {
        console.error("Error updating rate limit counter", error);
      }
    }

    console.log("post processing response....");
    console.log("res.data ", res.data);

    // and emit stripe token usage if applicable
    if (
      cloudBillingEnabled &&
      orgData.stripeCustomerId &&
      res.data &&
      res.data.promptTokens &&
      res.data.completionTokens
    ) {
      const stripeManager = new StripeManager(
        env.STRIPE_WEBHOOK_SECRET,
        env.STRIPE_SECRET_KEY,
        env.WALLET
      );
      const meterEvent = await stripeManager.emitTokenUsage(
        orgData.stripeCustomerId,
        {
          model: res.data.model,
          promptTokens: res.data.promptTokens,
          completionTokens: res.data.completionTokens,
          promptCacheWriteTokens: res.data.promptCacheWriteTokens,
          promptCacheReadTokens: res.data.promptCacheReadTokens,
        }
      );
      if (isError(meterEvent)) {
        console.error("Error emitting token usage", meterEvent.error);
        // TODO: add alerts
      } else {
        console.log("successfully emitted token usage");
      }
    } else if (cloudBillingEnabled) {
      if (!orgData.stripeCustomerId) {
        console.error("could not emit token usage to stripe");
        await walletStub.addToDisallowList(proxyRequest.requestId);
      } else if (!escrowInfo) {
        // already added to disallow list, this branch is a type guard to
        // allow accessing escrowInfo.provider and escrowInfo.model
      } else {
        console.error("could not parse token usage");
        await walletStub.addToDisallowList(proxyRequest.requestId, escrowInfo.provider, escrowInfo.model);
      }
    }
  }
}
