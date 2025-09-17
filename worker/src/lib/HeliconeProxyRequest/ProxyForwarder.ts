/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from "@helicone-package/llm-mapper/types";
import { createClient } from "@supabase/supabase-js";
import {
  checkRateLimit as checkRateLimitDO,
  updateRateLimitCounter as updateRateLimitCounterDO,
} from "../clients/DurableObjectRateLimiterClient";

import { HeliconeProducer } from "../clients/producers/HeliconeProducer";
import { checkPromptSecurity } from "../clients/PromptSecurityClient";
import { S3Client } from "../clients/S3Client";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { DBWrapper } from "../db/DBWrapper";
import { RequestResponseStore } from "../db/RequestResponseStore";
import { Valhalla } from "../db/valhalla";
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
import { getUsageProcessor } from "@helicone-package/cost/usage/getUsageProcessor";
import { EscrowInfo } from "../ai-gateway/types";
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
            rateLimited,
            response.status,
            undefined,
            undefined,
            undefined
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
          rateLimited,
          moderationRes.response?.status ?? 500,
          undefined,
          undefined,
          undefined
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
        undefined
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
  rateLimited: boolean,
  statusCode: number,
  S3_ENABLED?: Env["S3_ENABLED"],
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
  const db = new DBWrapper(env, auth);
  const { data: orgData, error: orgError } = await db.getAuthParams();
  if (!orgData) {
    console.error(
      "Could not get org data for request w/ id: ",
      proxyRequest.requestId
    );
    return;
  }

  const finalRateLimitOptions = proxyRequest.rateLimitOptions;

  // Start logging in parallel with response processing
  const logPromise = loggable.log(
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

  // Chain response processing after readResponse
  const responseProcessingPromise = loggable
    .readRawResponse()
    .then(async (rawResponseResult) => {
      if (rawResponseResult.error !== null) {
        console.error("Error reading raw response:", rawResponseResult.error);
        return;
      }
      
      const rawResponse = rawResponseResult.data;
      let cost = 0;
      let responseData = null;

      // parse response body to help get usage (legacy method compatibility)
      const responseBodyResult = await loggable.parseRawResponse(rawResponse);
      if (responseBodyResult.error !== null) {
        console.error("Error parsing response:", responseBodyResult.error);
        return;
      }
      responseData = responseBodyResult.data;

      // handle AI Gateway requests (successful Attempt)
      const successfulAttempt = proxyRequest.requestWrapper.getSuccessfulAttempt();
      if (rawResponse && successfulAttempt) {
        const attemptModel = successfulAttempt.endpoint.providerModelId;
        const attemptProvider = successfulAttempt.endpoint.provider;

        const usageProcessor = getUsageProcessor(attemptProvider);
        if (!usageProcessor) {
          throw new Error(`No usage processor found for AI Gateway provider: ${attemptProvider}`);
        }

        const usage = await usageProcessor.parse({
          responseBody: rawResponse,
          isStream: proxyRequest.isStream,
        });

        if (usage.error !== null) {
          throw new Error(`Error parsing usage for AI Gateway provider ${attemptProvider}: ${usage.error}`);
        }

        const breakdown = modelCostBreakdownFromRegistry({
          modelUsage: usage.data,
          model: attemptModel,
          provider: attemptProvider,
        });

        if (!breakdown) {
          throw new Error(`No cost breakdown found for AI Gateway model ${attemptModel} with provider ${attemptProvider}`);
        }

        cost = breakdown.totalCost;
      } else {
        // for non AI Gateway requests, we need to fall back to legacy methods when applicable
        const model = responseData.response.model;
        const provider = proxyRequest.provider;

        if (model && provider) {
          // Provider -> ModelProviderName to try and use new registry
          const modelProviderName = heliconeProviderToModelProviderName(provider);
          let calculatedCost = null;

          if (modelProviderName) {
            // try usage processor + new registry first
            const usageProcessor = getUsageProcessor(modelProviderName);
            if (usageProcessor) {
              try {
                const usage = await usageProcessor.parse({
                  responseBody: rawResponse,
                  isStream: proxyRequest.isStream,
                });

                if (usage.error === null) {
                  const breakdown = modelCostBreakdownFromRegistry({
                    modelUsage: usage.data,
                    model,
                    provider: modelProviderName,
                  });

                  if (breakdown) {
                    calculatedCost = breakdown.totalCost;
                  } else {
                    // not in new registry, fall back to legacy extraction + legacy registry
                    calculatedCost = costOfPrompt({
                      model,
                      provider,
                      promptTokens: responseData.response.prompt_tokens ?? 0,
                      completionTokens: responseData.response.completion_tokens ?? 0,
                      promptCacheWriteTokens: responseData.response.prompt_cache_write_tokens ?? 0,
                      promptCacheReadTokens: responseData.response.prompt_cache_read_tokens ?? 0,
                      promptAudioTokens: responseData.response.prompt_audio_tokens ?? 0,
                      completionAudioTokens: responseData.response.completion_audio_tokens ?? 0,
                    }) ?? 0;
                  }
                }
              } catch (error) {
                console.warn("Usage processor failed, falling back to legacy:", error);
              }
            }
          }

          // final fallback for providers not in ModelProviderName
          if (calculatedCost === null) {
            calculatedCost = costOfPrompt({
              model,
              promptTokens: responseData.response.prompt_tokens ?? 0,
              completionTokens: responseData.response.completion_tokens ?? 0,
              provider,
              promptCacheWriteTokens: responseData.response.prompt_cache_write_tokens ?? 0,
              promptCacheReadTokens: responseData.response.prompt_cache_read_tokens ?? 0,
              promptAudioTokens: responseData.response.prompt_audio_tokens ?? 0,
              completionAudioTokens: responseData.response.completion_audio_tokens ?? 0,
            }) ?? 0;
          }

          cost = calculatedCost;
        }
      }
      console.log("cost", cost);

      // Handle escrow finalization if needed
      if (responseData && proxyRequest.escrowInfo) {
        const walletId = env.WALLET.idFromName(orgData.organizationId);
        const walletStub = env.WALLET.get(walletId);
        const walletManager = new WalletManager(env, ctx, walletStub);
        const escrowFinalizationResult =
          await walletManager.finalizeEscrowAndSyncSpend(
            orgData.organizationId,
            proxyRequest,
            cost,
            statusCode,
            cachedResponse
          );
        if (escrowFinalizationResult.error !== null) {
          console.error(
            "Error finalizing escrow and syncing spend",
            escrowFinalizationResult.error
          );
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
          const costInCents = cost * 100;
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
