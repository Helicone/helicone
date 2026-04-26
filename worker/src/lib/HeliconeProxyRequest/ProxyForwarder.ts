/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from "@helicone-package/llm-mapper/types";
import { createClient } from "@supabase/supabase-js";
import {
  checkBucketRateLimit,
  recordBucketUsage,
} from "../rate-limit/bucketClient";
import {
  createDataDogTracer,
  DataDogTracer,
  TraceContext,
} from "../monitoring/DataDogTracer";

import { HeliconeProducer } from "../clients/producers/HeliconeProducer";
import { checkPromptSecurity } from "../clients/PromptSecurityClient";
import { S3Client } from "../clients/S3Client";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { DBWrapper } from "../db/DBWrapper";
import { DBLoggable } from "../dbLogger/DBLoggable";
import { Moderator } from "../managers/ModerationManager";
import {
  PEyeEyeManager,
  PEyeEyeMissingSecretsError,
  applyRedactedTexts,
  collectMessageTexts,
  type ChatMessage,
} from "../managers/PEyeEyeManager";
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

  // Create DataDog tracer for rate limit monitoring
  const tracer = createDataDogTracer(env);
  const traceContext = tracer.startTrace(
    "proxy.rate_limit",
    `${provider}:${request.url.pathname}`,
    { provider }
  );

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
                tracer,
                traceContext,
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

  // Token Bucket Rate Limiting
  // Supports both:
  // 1. Header-based: Helicone-RateLimit-Policy header
  // 2. DB-configured: API keys with rate limits in database (isRateLimitedKey)
  const rateLimitPolicyHeader =
    proxyRequest.requestWrapper.heliconeHeaders.rateLimitPolicy;
  let effectivePolicyHeader: string | null = rateLimitPolicyHeader;
  let useBucketRateLimiter = !!rateLimitPolicyHeader;

  // If no header policy but key has DB-configured rate limits, build policy from DB
  if (!rateLimitPolicyHeader && proxyRequest.isRateLimitedKey) {
    const { data: auth, error: authError } = await request.auth();
    if (authError === null) {
      const db = new DBWrapper(env, auth);
      const rateLimitManager = new RateLimitManager();
      const result = await rateLimitManager.getRateLimitOptionsForKey(
        db,
        proxyRequest.userId,
        proxyRequest.heliconeProperties
      );

      if (!result.error && result.data) {
        // Convert DB policy to header format for bucket rate limiter
        const opts = result.data;
        effectivePolicyHeader = `${opts.quota};w=${opts.time_window}${opts.unit ? `;u=${opts.unit}` : ""}${opts.segment ? `;s=${opts.segment}` : ""}`;
        useBucketRateLimiter = true;
      }
    }
  }

  // Apply bucket rate limiting if we have a policy
  if (useBucketRateLimiter && effectivePolicyHeader && !rateLimited) {
    const { data: auth, error: authError } = await request.auth();
    if (authError === null) {
      const db = new DBWrapper(env, auth);
      const { data: orgData, error: orgError } = await db.getAuthParams();
      if (orgError === null && orgData?.organizationId) {
        // Set org_id on tracer for correlation
        if (traceContext?.sampled) {
          tracer.setOrgId(orgData.organizationId);
        }

        try {
          const bucketResult = await checkBucketRateLimit({
            policyHeader: effectivePolicyHeader,
            organizationId: orgData.organizationId,
            userId: proxyRequest.userId,
            heliconeProperties: proxyRequest.heliconeProperties,
            rateLimiterDO: env.BUCKET_RATE_LIMITER,
            config: {
              failureMode: "fail-open", // Preserve availability on errors
            },
            tracer,
            traceContext,
          });

          responseBuilder.addTokenBucketRateLimitHeaders(bucketResult.headers);

          if (!bucketResult.allowed) {
            rateLimited = true;
            request.injectCustomProperty(
              "Helicone-Rate-Limit-Status",
              "bucket_rate_limited"
            );
          }
        } catch {
          // Rate limit check failed - fail open for availability
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
            tracer,
            traceContext,
            undefined,
            undefined,
            undefined,
            effectivePolicyHeader
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
          tracer,
          traceContext,
          undefined,
          undefined,
          undefined,
          effectivePolicyHeader
        )
      );

      if (moderationRes.isModerated) {
        return moderationRes.response;
      }
      // Passed moderation...
    }
  }

  // Peyeeye PII redaction (pre-call). Opt-in via `Helicone-Peyeeye-Enabled: true`.
  // If redaction fails, fail closed -- never forward unredacted text to the LLM.
  if (proxyRequest.requestWrapper.heliconeHeaders.peyeeyeEnabled) {
    if (!env.PEYEEYE_API_KEY) {
      return responseBuilder.build({
        body: JSON.stringify({
          success: false,
          error: {
            code: "PEYEEYE_MISCONFIGURED",
            message:
              "Helicone-Peyeeye-Enabled was set but the worker has no PEYEEYE_API_KEY binding.",
          },
        }),
        status: 500,
      });
    }
    try {
      const peyeeyeResult = await runPeyeeyeRedaction(proxyRequest, env);
      if (peyeeyeResult.error) {
        return responseBuilder.build({
          body: JSON.stringify({
            success: false,
            error: {
              code: "PEYEEYE_REDACT_FAILED",
              message: peyeeyeResult.error,
            },
          }),
          status: 502,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "peyeeye redaction failed";
      const status = err instanceof PEyeEyeMissingSecretsError ? 401 : 502;
      return responseBuilder.build({
        body: JSON.stringify({
          success: false,
          error: {
            code: "PEYEEYE_REDACT_FAILED",
            message,
          },
        }),
        status,
      });
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
        tracer,
        traceContext,
        undefined,
        undefined,
        undefined,
        effectivePolicyHeader
      )
    );
  }

  // Peyeeye rehydration (post-call). For non-streaming responses we buffer
  // the body, swap placeholders back, and ship a fresh body. For streaming
  // responses we currently pass through unchanged -- chunked rewriting would
  // break SSE framing.
  if (
    proxyRequest.peyeeyeSessionId &&
    !proxyRequest.isStream &&
    response.status >= 200 &&
    response.status < 300
  ) {
    const rehydratedBody = await rehydrateResponseBody(
      response,
      proxyRequest.peyeeyeSessionId,
      env
    );
    // Best-effort cleanup of the stateful session.
    if (
      proxyRequest.peyeeyeSessionMode === "stateful" &&
      proxyRequest.peyeeyeSessionId.startsWith("ses_")
    ) {
      try {
        const cleanupManager = new PEyeEyeManager({
          apiKey: env.PEYEEYE_API_KEY ?? "",
          apiBase: env.PEYEEYE_API_BASE,
        });
        ctx.waitUntil(
          cleanupManager.deleteSession(proxyRequest.peyeeyeSessionId)
        );
      } catch (err) {
        console.warn("peyeeye: scheduling session cleanup failed", err);
      }
    }
    return responseBuilder.build({
      body: rehydratedBody,
      inheritFrom: response,
      status: response.status,
    });
  }

  return responseBuilder.build({
    body: response.body,
    inheritFrom: response,
    status: response.status,
  });
}

// Pre-call: redact every text-bearing chunk in the request body and write
// the redacted body back via `setBody`. Stores the returned session id /
// sealed key on the proxy request for the post-call hook to pick up.
async function runPeyeeyeRedaction(
  proxyRequest: HeliconeProxyRequest,
  env: Env
): Promise<{ error: string | null }> {
  let bodyText: string;
  try {
    bodyText = (await proxyRequest.requestWrapper.unsafeGetBodyText()) || "";
  } catch (err) {
    return {
      error: `peyeeye: failed to read request body: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
  if (!bodyText) return { error: null };

  let parsed: { messages?: ChatMessage[]; [k: string]: unknown };
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    // Not JSON (e.g. multipart or empty) -- skip.
    return { error: null };
  }
  const messages = Array.isArray(parsed?.messages) ? parsed.messages : [];
  if (messages.length === 0) return { error: null };

  const parts = collectMessageTexts(messages);
  if (parts.length === 0) return { error: null };

  const sessionMode =
    proxyRequest.requestWrapper.heliconeHeaders.peyeeyeSessionMode ??
    "stateful";

  const manager = new PEyeEyeManager({
    apiKey: env.PEYEEYE_API_KEY ?? "",
    apiBase: env.PEYEEYE_API_BASE,
    sessionMode,
  });

  const { redacted, sessionId } = await manager.redact(
    parts.map((p) => p.text)
  );

  applyRedactedTexts(messages, parts, redacted);
  parsed.messages = messages;
  await proxyRequest.requestWrapper.setBody(JSON.stringify(parsed));

  if (sessionId) {
    proxyRequest.peyeeyeSessionId = sessionId;
    proxyRequest.peyeeyeSessionMode = sessionMode;
  }

  return { error: null };
}

// Post-call: read the response body once, parse JSON, rehydrate any
// chat-completion-style text fields, return a fresh body string. Best-effort
// -- on any failure we fall back to the original body so the caller still
// gets their response.
async function rehydrateResponseBody(
  response: Response,
  sessionId: string,
  env: Env
): Promise<string> {
  let raw: string;
  try {
    raw = await response.clone().text();
  } catch (err) {
    console.warn("peyeeye: failed to read response body for rehydration", err);
    return await response.text().catch(() => "");
  }
  if (!raw) return raw;

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Not JSON; ship as-is.
    return raw;
  }

  const manager = new PEyeEyeManager({
    apiKey: env.PEYEEYE_API_KEY ?? "",
    apiBase: env.PEYEEYE_API_BASE,
  });

  try {
    const choices = Array.isArray(parsed?.choices) ? parsed.choices : [];
    for (const choice of choices) {
      const message = choice?.message;
      if (!message) continue;
      if (typeof message.content === "string" && message.content) {
        message.content = await manager.rehydrate(message.content, sessionId);
      } else if (Array.isArray(message.content)) {
        for (const part of message.content) {
          if (part && typeof part === "object" && part.type === "text") {
            const t = typeof part.text === "string" ? part.text : "";
            if (t) part.text = await manager.rehydrate(t, sessionId);
          }
        }
      }
    }
    // Anthropic-style: top-level `content` array of `{type:"text", text}`.
    if (Array.isArray(parsed?.content)) {
      for (const part of parsed.content) {
        if (part && typeof part === "object" && part.type === "text") {
          const t = typeof part.text === "string" ? part.text : "";
          if (t) part.text = await manager.rehydrate(t, sessionId);
        }
      }
    }
    return JSON.stringify(parsed);
  } catch (err) {
    console.warn("peyeeye: rehydrate pass failed", err);
    return raw;
  }
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
  tracer: DataDogTracer,
  traceContext: TraceContext | null,
  S3_ENABLED?: Env["S3_ENABLED"],
  cachedResponse?: Response,
  cacheSettings?: CacheSettings,
  rateLimitPolicyHeader?: string | null
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
        const costInCents = (cost ?? 0) * 100;

        // Update bucket rate limiter (for cost-based policies)
        if (
          rateLimitPolicyHeader &&
          proxyRequest &&
          !orgError &&
          orgData?.organizationId
        ) {
          await recordBucketUsage({
            policyHeader: rateLimitPolicyHeader,
            organizationId: orgData.organizationId,
            userId: proxyRequest.userId,
            heliconeProperties:
              proxyRequest.requestWrapper.heliconeHeaders.heliconeProperties,
            rateLimiterDO: env.BUCKET_RATE_LIMITER,
            costCents: costInCents,
            tracer,
            traceContext,
          });
        }
      }

      // Finish trace and send to DataDog
      if (tracer && traceContext?.sampled) {
        tracer.finishTrace({ rate_limited: rateLimited.toString() });
        await tracer.sendTrace();
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
