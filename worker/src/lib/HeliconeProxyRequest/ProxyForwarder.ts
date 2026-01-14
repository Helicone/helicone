/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from "@helicone-package/llm-mapper/types";
import { createClient } from "@supabase/supabase-js";
import {
  checkRateLimit as checkRateLimitDO,
  updateRateLimitCounter as updateRateLimitCounterDO,
} from "../clients/DurableObjectRateLimiterClient";
import { checkTokenBucketRateLimit } from "../rate-limit/tokenBucketClient";

import { HeliconeProducer } from "../clients/producers/HeliconeProducer";
import { checkPromptSecurity } from "../clients/PromptSecurityClient";
import { S3Client } from "../clients/S3Client";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { DBWrapper } from "../db/DBWrapper";
import { DBLoggable } from "../dbLogger/DBLoggable";
import { Moderator } from "../managers/ModerationManager";
import { RateLimitManager } from "../managers/RateLimitManager";
import { RequestResponseManager } from "../managers/RequestResponseManager";
import { SentryManager } from "../managers/SentryManager";
import {
  HeliconeProxyRequest,
  HeliconeProxyRequestMapper,
} from "../models/HeliconeProxyRequest";
import { RequestWrapper } from "../RequestWrapper";
import { ResponseBuilder } from "../ResponseBuilder";
import { getCachedResponse, saveToCache } from "../util/cache/cacheFunctions";
import { CacheSettings, getCacheSettings } from "../util/cache/cacheSettings";
import { DBQueryTimer } from "../util/loggers/DBQueryTimer";
import { Result } from "../util/results";
import {
  handleProxyRequest,
  handleThreatProxyRequest,
} from "./ProxyRequestHandler";
import { WalletManager } from "../managers/WalletManager";
import { costOfPrompt } from "@helicone-package/cost";
import { EscrowInfo } from "../ai-gateway/types";
import { getUsageProcessor } from "@helicone-package/cost/usage/getUsageProcessor";
import { modelCostBreakdownFromRegistry } from "@helicone-package/cost/costCalc";
import { heliconeProviderToModelProviderName } from "@helicone-package/cost/models/provider-helpers";

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
      env,
      escrowInfo
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

  let rateLimited = false;
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
                rateLimited,
                response.status,
                "false", // S3_ENABLED
                cachedResponse,
                cacheSettings
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

  // Check if using new token bucket rate limiter (via Helicone-RateLimit-Policy header)
  // If so, skip the old sliding window rate limiter to avoid conflicts
  const rateLimitPolicyHeader =
    proxyRequest.requestWrapper.heliconeHeaders.rateLimitPolicy;
  const useTokenBucketRateLimiter = !!rateLimitPolicyHeader;

  // Old sliding window rate limiter (only run if NOT using token bucket)
  let finalRateLimitOptions = useTokenBucketRateLimiter
    ? null
    : proxyRequest.rateLimitOptions;
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
          try {
            const rateLimitCheckResult = await checkRateLimitDO({
              organizationId: orgData.organizationId,
              heliconeProperties: proxyRequest.heliconeProperties,
              rateLimiterDO: env.RATE_LIMITER_SQL,
              rateLimitOptions: finalRateLimitOptions,
              userId: proxyRequest.userId,
              cost: 1,
            });
            responseBuilder.addRateLimitHeaders(
              rateLimitCheckResult,
              finalRateLimitOptions
            );

            if (rateLimitCheckResult.status === "rate_limited") {
              rateLimited = true;
              request.injectCustomProperty(
                "Helicone-Rate-Limit-Status",
                rateLimitCheckResult.status
              );
            }
          } catch (error) {
            console.error("Error checking rate limit", error);
          }
        }
      }
    }
  }

  // Token Bucket Rate Limiting (via Helicone-RateLimit-Policy header)
  if (useTokenBucketRateLimiter && !rateLimited) {
    const { data: auth, error: authError } = await request.auth();
    if (authError === null) {
      const db = new DBWrapper(env, auth);
      const { data: orgData, error: orgError } = await db.getAuthParams();
      if (orgError === null && orgData?.organizationId) {
        try {
          const tokenBucketResult = await checkTokenBucketRateLimit({
            policyHeader: rateLimitPolicyHeader,
            organizationId: orgData.organizationId,
            userId: proxyRequest.userId,
            heliconeProperties: proxyRequest.heliconeProperties,
            rateLimiterDO: env.TOKEN_BUCKET_RATE_LIMITER,
            config: {
              failureMode: "fail-open", // Preserve availability on errors
            },
          });

          responseBuilder.addTokenBucketRateLimitHeaders(
            tokenBucketResult.headers
          );

          if (!tokenBucketResult.allowed) {
            rateLimited = true;
            request.injectCustomProperty(
              "Helicone-Rate-Limit-Status",
              "token_bucket_rate_limited"
            );
          }
        } catch (error) {
          console.error("Error checking token bucket rate limit", error);
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
      await parseLatestMessage(proxyRequest);
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
            rateLimited,
            response.status,
            undefined,
            undefined,
            undefined,
            useTokenBucketRateLimiter
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
      await parseLatestMessage(proxyRequest);

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
          rateLimited,
          moderationRes.response?.status ?? 500,
          undefined,
          undefined,
          undefined,
          useTokenBucketRateLimiter
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
    rateLimited ? responseBuilder.buildRateLimitedResponse() : undefined
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
                    ? (error.stack ?? error.message)
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
        rateLimited,
        response.status,
        undefined,
        undefined,
        undefined,
        useTokenBucketRateLimiter
      )
    );
  }

  return responseBuilder.build({
    body: response.body,
    inheritFrom: response,
    status: response.status,
  });
}

async function parseLatestMessage(
  proxyRequest: HeliconeProxyRequest
): Promise<Result<LatestMessage, string>> {
  try {
    return {
      error: null,
      data: JSON.parse(
        (await proxyRequest.unsafeGetBodyText?.()) || "{}"
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
  rateLimited: boolean,
  statusCode: number,
  S3_ENABLED?: Env["S3_ENABLED"],
  cachedResponse?: Response,
  cacheSettings?: CacheSettings,
  useTokenBucketRateLimiter?: boolean
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
  const db = new DBWrapper(env, auth);
  const { data: orgData, error: orgError } = await db.getAuthParams();
  if (!orgData) {
    console.error(
      "Could not get org data for request w/ id: ",
      proxyRequest.requestId
    );
    return;
  }

  // Skip old sliding window rate limiter counter update when using token bucket
  const finalRateLimitOptions = useTokenBucketRateLimiter
    ? null
    : proxyRequest.rateLimitOptions;

  // Start logging in parallel with response processing
  const logPromise = loggable.log(
    {
      clickhouse: new ClickhouseClientWrapper(env),
      supabase: supabase,
      dbWrapper: new DBWrapper(env, auth),
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

  // Chain response processing after readResponse
  const responseProcessingPromise = loggable
    .readRawResponse()
    .then(async (rawResponseResult) => {
      if (rawResponseResult.error !== null) {
        console.error("Error reading raw response:", rawResponseResult.error);
        return;
      }

      const rawResponse = rawResponseResult.data;
      let cost: number | undefined = undefined;

      // handle all AI Gateway requests (both BYOK and PTB)
      const gatewayAttempt = proxyRequest.requestWrapper.getGatewayAttempt();
      if (rawResponse && gatewayAttempt) {
        const attemptModel = gatewayAttempt.endpoint.providerModelId;
        const attemptProvider = gatewayAttempt.endpoint.provider;

        const usageProcessor = getUsageProcessor(attemptProvider);

        if (usageProcessor) {
          const usage = await usageProcessor.parse({
            responseBody: rawResponse,
            isStream: proxyRequest.isStream,
            model: attemptModel,
          });

          if (usage.data) {
            const breakdown = modelCostBreakdownFromRegistry({
              modelUsage: usage.data,
              providerModelId: attemptModel,
              provider: attemptProvider,
            });

            if (breakdown) {
              cost = breakdown.totalCost;
            }
          } else {
            console.error(
              `No usage data found for AI Gateway model ${attemptModel} with provider ${attemptProvider}`
            );
          }
        } else {
          console.error(
            `No usage processor available for provider ${attemptProvider}`
          );
        }
      } else {
        // for non AI Gateway requests, we need to fall back to legacy methods when applicable
        // parse response body to help get usage (legacy method compatibility)
        const responseBodyResult = await loggable.parseRawResponse(rawResponse);
        if (responseBodyResult.error !== null) {
          console.error("Error parsing response:", responseBodyResult.error);
          return;
        }
        const responseData = responseBodyResult.data;

        const model = responseData?.response.model;
        const provider = proxyRequest.provider;

        if (model && provider && responseData) {
          // Provider -> ModelProviderName to try and use new registry
          const modelProviderName =
            heliconeProviderToModelProviderName(provider);

          if (modelProviderName) {
            // try usage processor + new registry first
            const usageProcessor = getUsageProcessor(modelProviderName);

            if (usageProcessor) {
              const usage = await usageProcessor.parse({
                responseBody: rawResponse,
                isStream: proxyRequest.isStream,
                model: model,
              });

              if (usage.data) {
                const breakdown = modelCostBreakdownFromRegistry({
                  modelUsage: usage.data,
                  providerModelId: model,
                  provider: modelProviderName,
                });

                cost = breakdown?.totalCost;
              }
            }
          }

          // final fallback for providers not in ModelProviderName
          if (cost === undefined) {
            cost =
              costOfPrompt({
                model,
                promptTokens: responseData.response.prompt_tokens ?? 0,
                completionTokens: responseData.response.completion_tokens ?? 0,
                provider,
                promptCacheWriteTokens:
                  responseData.response.prompt_cache_write_tokens ?? 0,
                promptCacheReadTokens:
                  responseData.response.prompt_cache_read_tokens ?? 0,
                promptAudioTokens:
                  responseData.response.prompt_audio_tokens ?? 0,
                completionAudioTokens:
                  responseData.response.completion_audio_tokens ?? 0,
              }) ?? 0;
          }
        }
      }

      // Handle escrow finalization if needed
      const walletId = env.WALLET.idFromName(orgData.organizationId);
      const walletStub = env.WALLET.get(walletId);
      const walletManager = new WalletManager(env, ctx, walletStub);

      if (!cachedResponse) {
        const checkTopOffPromise =
          walletManager.walletStub.checkAndScheduleAutoTopoffAlarm(
            orgData.organizationId
          );

        if (proxyRequest.escrowInfo) {
          // Convert cost from USD to cents (cost is in USD dollars, wallet expects cents)
          const costInCents = cost !== undefined ? cost * 100 : undefined;

          const escrowFinalizationResult =
            await walletManager.finalizeEscrowAndSyncSpend(
              orgData.organizationId,
              proxyRequest,
              costInCents,
              statusCode
            );
          if (escrowFinalizationResult.error !== null) {
            console.error(
              "Error finalizing escrow and syncing spend",
              escrowFinalizationResult.error
            );
          }
        }

        // Wait for top-off check to complete
        await checkTopOffPromise;
      } else {
        if (proxyRequest.escrowInfo) {
          const escrowResult = await proxyRequest.escrowInfo.escrow;
          if (escrowResult.data) {
            await walletStub.cancelEscrow(escrowResult.data.reservedEscrowId);
          }
        }
      }

      // Update rate limit counters if not a cached response
      if (
        (!rateLimited && cachedResponse === undefined) ||
        (!rateLimited && cachedResponse === null)
      ) {
        if (
          proxyRequest &&
          finalRateLimitOptions &&
          !orgError &&
          orgData?.organizationId
        ) {
          const costInCents = (cost ?? 0) * 100;
          await updateRateLimitCounterDO({
            organizationId: orgData?.organizationId,
            heliconeProperties:
              proxyRequest.requestWrapper.heliconeHeaders.heliconeProperties,
            rateLimiterDO: env.RATE_LIMITER_SQL,
            rateLimitOptions: finalRateLimitOptions,
            userId: proxyRequest.userId,
            cost: costInCents,
          });
        }
      }
    })
    .catch((error) => {
      console.error("Error in response processing chain:", error);
    });

  // Wait for both logging and response processing to complete
  await Promise.all([
    logPromise.then((logResult) => {
      if (logResult.error !== null) {
        console.error("Error logging", logResult.error);
      }
    }),
    responseProcessingPromise,
  ]);
}
