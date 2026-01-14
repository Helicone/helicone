/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { Provider } from "../..";
import { Database, Json } from "../../../supabase/database.types";

import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { DBWrapper } from "../db/DBWrapper";
import { RequestResponseStore } from "../db/RequestResponseStore";
import { RequestResponseManager } from "../managers/RequestResponseManager";
import { AsyncLogModel } from "../models/AsyncLog";
import { HeliconeHeaders } from "../models/HeliconeHeaders";
import { HeliconeProxyRequest } from "../models/HeliconeProxyRequest";
import {
  Prompt2025Settings,
  PromptSettings,
  RequestWrapper,
} from "../RequestWrapper";
import { INTERNAL_ERRORS } from "../util/constants";
import { withTimeout } from "../util/helpers";
import { Result, err, ok } from "../util/results";
import { CacheSettings } from "../util/cache/cacheSettings";
import {
  anthropicAIStream,
  getModel,
} from "./streamParsers/anthropicStreamParser";
import { parseOpenAIStream } from "./streamParsers/openAIStreamParser";
import { parseVercelStream } from "./streamParsers/vercelStreamParser";

import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { normalizeAIGatewayResponse } from "@helicone-package/llm-mapper/transform/providers/normalizeResponse";
import { HeliconeProducer } from "../clients/producers/HeliconeProducer";
import { MessageData } from "../clients/producers/types";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";
import { Attempt, EscrowInfo } from "../ai-gateway/types";
import {
  IRequestBodyBuffer,
  ValidRequestBody,
} from "../../RequestBodyBuffer/IRequestBodyBuffer";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { BodyMappingType } from "@helicone-package/cost/models/types";

export interface DBLoggableProps {
  response: {
    responseId: string;
    getResponseBody: () => Promise<{
      body: string[];
      endTime: Date;
    }>;
    status: () => Promise<number>;
    responseHeaders: Headers;
    omitLog: boolean;
    cost?: number;
  };
  request: {
    requestId: string;
    userId?: string;
    heliconeProxyKeyId?: string;
    promptSettings: PromptSettings;
    prompt2025Settings: Prompt2025Settings;
    startTime: Date;
    body: ValidRequestBody;
    requestBodyBuffer: IRequestBodyBuffer;
    unsafeGetBodyText?: () => Promise<string | null>;
    path: string;
    targetUrl: string;
    properties: Record<string, string>;
    isStream: boolean;
    omitLog: boolean;
    provider: Provider;
    nodeId: string | null;
    modelOverride?: string;
    heliconeTemplate?: TemplateWithInputs;
    threat: boolean | null;
    flaggedForModeration: boolean | null;
    request_ip: string | null;
    country_code: string | null;
    requestReferrer: string | null;
    // set for AI Gateway PTB requests
    escrowInfo?: EscrowInfo;
    // set for all AI Gateway requests (PTB+BYOK)
    attempt?: Attempt;
  };
  timing: {
    startTime: Date;
    endTime?: Date;
    timeToFirstToken: () => Promise<number | null>;
  };
  tokenCalcUrl: string;
}

export interface AuthParams {
  organizationId: string;
  userId?: string;
  heliconeApiKeyId?: number;
  tier: string;
  accessDict: {
    cache: boolean;
  };
  metaData: {
    allowNegativeBalance: boolean;
    creditLimit: number;
  };
}

export interface ParsedResponseData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: {
    id: string;
    created_at: string;
    request: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: any;
    status: number;
    completion_tokens?: number;
    prompt_tokens?: number;
    time_to_first_token?: number | null;
    model?: string;
    delay_ms?: number;
    prompt_cache_write_tokens?: number;
    prompt_cache_read_tokens?: number;
    prompt_audio_tokens?: number;
    completion_audio_tokens?: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

export function dbLoggableRequestFromProxyRequest(
  proxyRequest: HeliconeProxyRequest,
  requestStartTime: Date
): DBLoggableProps["request"] {
  return {
    requestId: proxyRequest.requestId,
    heliconeProxyKeyId: proxyRequest.heliconeProxyKeyId,
    promptSettings: proxyRequest.requestWrapper.promptSettings,
    prompt2025Settings: proxyRequest.requestWrapper.prompt2025Settings,
    heliconeTemplate: proxyRequest.heliconePromptTemplate ?? undefined,
    userId: proxyRequest.userId,
    startTime: requestStartTime,
    unsafeGetBodyText: proxyRequest.unsafeGetBodyText,
    body: proxyRequest.body,
    requestBodyBuffer: proxyRequest.requestWrapper.requestBodyBuffer,
    path: proxyRequest.requestWrapper.url.href,
    targetUrl: proxyRequest.targetUrl.href,
    properties: proxyRequest.requestWrapper.heliconeHeaders.heliconeProperties,
    isStream: proxyRequest.isStream,
    omitLog: proxyRequest.omitOptions.omitRequest,
    provider: proxyRequest.provider,
    nodeId: proxyRequest.nodeId,
    modelOverride:
      proxyRequest.requestWrapper.heliconeHeaders.modelOverride ?? undefined,
    threat: proxyRequest.threat ?? null,
    flaggedForModeration: proxyRequest.flaggedForModeration ?? null,
    request_ip: null,
    country_code: (proxyRequest.requestWrapper.cf?.country as string) ?? null,
    requestReferrer: proxyRequest.requestWrapper.requestReferrer ?? null,
    escrowInfo: proxyRequest.escrowInfo ?? undefined,
    attempt: proxyRequest.requestWrapper.getGatewayAttempt() ?? undefined,
  };
}

interface DBLoggableRequestFromAsyncLogModelProps {
  requestWrapper: RequestWrapper;
  env: Env;
  asyncLogModel: AsyncLogModel;
  providerRequestHeaders: HeliconeHeaders;
  providerResponseHeaders: Headers;
  provider: Provider;
  heliconeTemplate?: TemplateWithInputs;
}

function getResponseBodyFromJSON(json: Record<string, Json>): {
  body: string[];
  endTime: Date;
} {
  // This will mock the response as if it came from OpenAI
  if (json.streamed_data) {
    const streamedData = json.streamed_data as Json[];
    return {
      body: streamedData.map((d) => "data: " + JSON.stringify(d)),
      endTime: new Date(),
    };
  }
  return { body: [JSON.stringify(json)], endTime: new Date() };
}

export async function dbLoggableRequestFromAsyncLogModel(
  props: DBLoggableRequestFromAsyncLogModelProps
): Promise<DBLoggable> {
  const {
    requestWrapper,
    env,
    asyncLogModel,
    providerRequestHeaders,
    providerResponseHeaders,
    provider,
    heliconeTemplate,
  } = props;

  return new DBLoggable({
    request: {
      requestId: providerRequestHeaders.requestId ?? crypto.randomUUID(),
      promptSettings: providerRequestHeaders.promptHeaders?.promptId
        ? {
            promptId: providerRequestHeaders.promptHeaders.promptId,
            promptVersion:
              providerRequestHeaders.promptHeaders.promptVersion ?? "",
            promptMode: "production",
          }
        : {
            promptId: undefined,
            promptVersion: "",
            promptMode: "deactivated",
          },
      prompt2025Settings: requestWrapper.prompt2025Settings,
      requestBodyBuffer: requestWrapper.requestBodyBuffer,
      userId: providerRequestHeaders.userId ?? undefined,
      startTime: asyncLogModel.timing
        ? new Date(
            asyncLogModel.timing.startTime.seconds * 1000 +
              asyncLogModel.timing.startTime.milliseconds
          )
        : new Date(),
      body: JSON.stringify(asyncLogModel.providerRequest.json),

      unsafeGetBodyText: async () =>
        JSON.stringify(asyncLogModel.providerRequest.json),
      path: asyncLogModel.providerRequest.url,
      targetUrl: asyncLogModel.providerRequest.url,
      properties: providerRequestHeaders.heliconeProperties,
      isStream: asyncLogModel.providerRequest.json?.stream == true,
      omitLog: false,
      provider,
      nodeId: requestWrapper.getNodeId(),
      modelOverride: requestWrapper.heliconeHeaders.modelOverride ?? undefined,
      threat: null,
      flaggedForModeration: null,
      request_ip: null,
      country_code: (requestWrapper.cf?.country as string) ?? null,
      heliconeTemplate: heliconeTemplate ?? undefined,
      requestReferrer: requestWrapper.requestReferrer ?? null,
    },
    response: {
      responseId: crypto.randomUUID(),
      getResponseBody: async () => {
        if (asyncLogModel.providerResponse.textBody) {
          return {
            body: [asyncLogModel.providerResponse.textBody],
            endTime: new Date(),
          };
        }
        return getResponseBodyFromJSON(asyncLogModel.providerResponse.json);
      },
      responseHeaders: providerResponseHeaders,
      status: async () => asyncLogModel.providerResponse.status,
      omitLog: false,
      cost: asyncLogModel.providerResponse.cost,
    },
    timing: {
      startTime: asyncLogModel.timing
        ? new Date(
            asyncLogModel.timing.startTime.seconds * 1000 +
              asyncLogModel.timing.startTime.milliseconds
          )
        : new Date(),
      endTime: asyncLogModel.timing
        ? new Date(
            asyncLogModel.timing.endTime.seconds * 1000 +
              asyncLogModel.timing.endTime.milliseconds
          )
        : new Date(new Date().getTime() + 1000),
      timeToFirstToken: async () =>
        asyncLogModel.timing
          ? (Number(asyncLogModel.timing.timeToFirstToken) ?? null)
          : null,
    },
    tokenCalcUrl: env.VALHALLA_URL,
  });
}

// Represents an object that can be logged to the database
export class DBLoggable {
  private response: DBLoggableProps["response"];
  private request: DBLoggableProps["request"];
  private timing: DBLoggableProps["timing"];
  private provider: Provider;
  private tokenCalcUrl: string;

  constructor(props: DBLoggableProps) {
    this.response = props.response;
    this.request = props.request;
    this.timing = props.timing;
    this.provider = props.request.provider;
    this.tokenCalcUrl = props.tokenCalcUrl;
  }

  async waitForResponse(): Promise<{
    body: string[];
    endTime: Date;
  }> {
    return await this.response.getResponseBody();
  }

  getTimingStart(): number {
    return this.timing.startTime.getTime();
  }

  async parseResponse(
    responseBody: string,
    status: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Result<any, string>> {
    let result = responseBody;
    const isStream = await this.request.requestBodyBuffer.isStream();
    const model = await this.request.requestBodyBuffer.model();
    const responseStatus = await this.response.status();
    if (isStream && status === INTERNAL_ERRORS["Cancelled"]) {
      // Remove last line of stream from result
      result = result.split("\n").slice(0, -1).join("\n");
    }

    const HTTPSErrorRange = responseStatus >= 400 && responseStatus < 600;
    const HTTPSRedirect = responseStatus >= 300 && responseStatus < 400;

    try {
      if (HTTPSErrorRange || HTTPSRedirect) {
        return ok(JSON.parse(result));
      } else if (!isStream && this.provider === "ANTHROPIC") {
        const responseJson = JSON.parse(result);
        if (model?.includes("claude-3")) {
          if (
            !responseJson?.usage?.output_tokens ||
            !responseJson?.usage?.input_tokens
          ) {
            return ok(responseJson);
          } else {
            return ok({
              ...responseJson,
              usage: {
                total_tokens:
                  responseJson?.usage?.output_tokens +
                  responseJson?.usage?.input_tokens,
                prompt_tokens: responseJson?.usage?.input_tokens,
                completion_tokens: responseJson?.usage?.output_tokens,
                helicone_calculated: true,
              },
            });
          }
        } else {
          return ok({
            ...responseJson,
            usage: {
              total_tokens: -1,
              prompt_tokens: -1,
              completion_tokens: -1,
              helicone_calculated: true,
            },
          });
        }
      } else if (!isStream && this.provider === "GOOGLE") {
        const responseJson = JSON.parse(result);
        let usageMetadataItem;
        if (Array.isArray(responseJson)) {
          usageMetadataItem = responseJson.find((item) => item.usageMetadata);
        } else {
          usageMetadataItem = responseJson.usageMetadata
            ? responseJson
            : undefined;
        }

        return ok({
          usage: {
            total_tokens: usageMetadataItem?.usageMetadata?.totalTokenCount,
            prompt_tokens: usageMetadataItem?.usageMetadata?.promptTokenCount,
            completion_tokens:
              (usageMetadataItem?.usageMetadata?.thoughtsTokenCount ?? 0) +
              (usageMetadataItem?.usageMetadata?.candidatesTokenCount ?? 0),
            helicone_calculated: false,
          },
        });
      } else if (isStream && this.provider === "ANTHROPIC") {
        return anthropicAIStream(result);
      } else if (isStream) {
        return parseOpenAIStream(result);
      } else if (
        this.provider === "VERCEL" &&
        result.includes("data: {") &&
        result.includes('"type":')
      ) {
        // Vercel streams detected by response body pattern
        return parseVercelStream(result);
      } else {
        return ok(JSON.parse(result));
      }
    } catch (e) {
      console.log("Error parsing response 1", e);
      return {
        data: null,
        error: "error parsing response, " + e + ", " + result,
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tryJsonParse(text: string): any {
    try {
      return JSON.parse(text);
    } catch (e) {
      return {
        error: "error parsing response, " + e + ", " + text,
      };
    }
  }

  getUsage(parsedResponse: unknown): {
    prompt_tokens: number | undefined;
    completion_tokens: number | undefined;
  } {
    if (
      typeof parsedResponse !== "object" ||
      parsedResponse === null ||
      !("usage" in parsedResponse)
    ) {
      return {
        prompt_tokens: undefined,
        completion_tokens: undefined,
      };
    }

    const response = parsedResponse as {
      usage: {
        prompt_tokens?: number;
        completion_tokens?: number;
        input_tokens?: number;
        output_tokens?: number;
        inputTokens?: number;
        outputTokens?: number;
      };
    };
    const usage = response.usage;

    return {
      prompt_tokens:
        usage?.prompt_tokens ?? usage?.input_tokens ?? usage?.inputTokens,
      completion_tokens:
        usage?.completion_tokens ?? usage?.output_tokens ?? usage?.outputTokens,
    };
  }

  async getStatus() {
    return await this.response.status();
  }

  // TODO: Refactor, see ProxyForwarder
  async getRawResponse() {
    const { body: responseBody, endTime: responseEndTime } =
      await this.response.getResponseBody();
    return responseBody.join("");
  }

  async readRawResponse(): Promise<Result<string, string>> {
    try {
      const rawResponse = await withTimeout(
        this.getRawResponse(),
        1000 * 60 * 15
      ); // 15 minutes

      return ok(rawResponse);
    } catch (e) {
      return err("error getting raw response, " + e);
    }
  }

  async parseRawResponse(
    rawResponse: string
  ): Promise<Result<{ response: ParsedResponseData["response"] }, string>> {
    try {
      const parsedData = await withTimeout(
        this.parseRawResponseInternal(rawResponse),
        1000 * 60 * 30
      ); // 30 minutes

      return ok({
        response: parsedData.response,
      });
    } catch (e) {
      return err("error parsing raw response, " + e);
    }
  }

  private async parseRawResponseInternal(
    rawResponse: string
  ): Promise<ParsedResponseData> {
    const endTime = this.timing.endTime ?? new Date();
    const delay_ms = endTime.getTime() - this.timing.startTime.getTime();
    const timeToFirstToken = this.request.isStream
      ? await this.timing.timeToFirstToken()
      : null;
    const status = await this.response.status();
    const parsedResponse = await this.parseResponse(rawResponse, status);
    const isStream = this.request.isStream;

    const usage = this.getUsage(parsedResponse.data);

    if (
      !isStream &&
      this.provider === "GOOGLE" &&
      parsedResponse.error === null
    ) {
      const body = this.tryJsonParse(rawResponse);
      const model = body?.model ?? body?.body?.model ?? undefined;

      return {
        response: {
          id: this.response.responseId,
          created_at: endTime.toISOString(),
          request: this.request.requestId,
          body: this.response.omitLog // TODO: Remove in favor of S3 storage
            ? {
                usage: parsedResponse.data?.usage,
                model,
              }
            : body,
          status: await this.response.status(),
          completion_tokens: usage.completion_tokens,
          prompt_tokens: usage.prompt_tokens,
          time_to_first_token: timeToFirstToken,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model: model,
          delay_ms,
        },
        body: this.response.omitLog
          ? {
              usage: parsedResponse.data?.usage,
              model,
            }
          : body,
      };
    }

    return parsedResponse.error === null
      ? {
          response: {
            id: this.response.responseId,
            created_at: endTime.toISOString(),
            request: this.request.requestId,
            body: this.response.omitLog // TODO: Remove in favor of S3 storage
              ? {
                  usage: parsedResponse.data?.usage,
                  model:
                    parsedResponse.data?.model ??
                    parsedResponse.data?.providerMetadata?.gateway?.routing
                      ?.originalModelId,
                }
              : parsedResponse.data,
            status: await this.response.status(),
            completion_tokens: usage.completion_tokens,
            prompt_tokens: usage.prompt_tokens,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            model:
              (parsedResponse.data as any)?.model ??
              (parsedResponse.data as any)?.providerMetadata?.gateway?.routing
                ?.originalModelId ??
              undefined,
            delay_ms,
            time_to_first_token: timeToFirstToken,
          },
          body: this.response.omitLog
            ? {
                usage: parsedResponse.data?.usage,
                model: parsedResponse.data?.model,
              }
            : parsedResponse.data,
        }
      : {
          response: {
            id: this.response.responseId,
            request: this.request.requestId,
            created_at: endTime.toISOString(),
            body: {
              // TODO: Remove in favor of S3 storage
              helicone_error: "error parsing response",
              parse_response_error: parsedResponse.error,
              body: parsedResponse.data,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            model:
              (parsedResponse.data as any)?.model ??
              (parsedResponse.data as any)?.providerMetadata?.gateway?.routing
                ?.originalModelId ??
              undefined,
            status: await this.response.status(),
          },
          body: {
            helicone_error: "error parsing response",
            parse_response_error: parsedResponse.error,
            body: parsedResponse.data,
          },
        };
  }

  isSuccessResponse = (status: number | undefined | null): boolean =>
    status != null && status >= 200 && status <= 299;

  async log(
    db: {
      supabase: SupabaseClient<Database>; // TODO : Deprecate
      dbWrapper: DBWrapper;
      clickhouse: ClickhouseClientWrapper;
      requestResponseManager: RequestResponseManager;
      producer: HeliconeProducer;
    },
    S3_ENABLED: Env["S3_ENABLED"],
    requestHeaders?: HeliconeHeaders,
    cachedHeaders?: Headers,
    cacheSettings?: CacheSettings
  ): Promise<Result<void, string>> {
    try {
      const { data: authParams, error } = await db.dbWrapper.getAuthParams();
      if (error || !authParams?.organizationId) {
        return err(`Auth failed! ${error}`);
      }

      let orgRateLimit = false;
      try {
        const org = await db.dbWrapper.getOrganization();
        if (org.error !== null) {
          return err(org.error);
        }

        const tier = org.data?.tier;

        const rateLimiter = await db.dbWrapper.getRateLimiter();
        if (rateLimiter.error !== null) {
          throw new Error(rateLimiter.error);
        }
        // TODO: Add an early exit if we really want to rate limit in the future
        const rateLimit = await rateLimiter.data.checkRateLimit(tier);
        if (rateLimit.data?.isRateLimited) {
          orgRateLimit = true;
        }
        if (rateLimit.error) {
          console.error(`Error checking rate limit: ${rateLimit.error}`);
        }
      } catch (e) {
        console.error(`Error checking rate limit: ${e}`);
      }

      await this.useKafka(
        db,
        authParams,
        S3_ENABLED,
        orgRateLimit,
        requestHeaders,
        cachedHeaders,
        cacheSettings
      );
      return ok(undefined);
    } catch (error) {
      return err("Error logging");
    }
  }

  async useKafka(
    db: {
      supabase: SupabaseClient<Database>; // TODO : Deprecate
      dbWrapper: DBWrapper;
      clickhouse: ClickhouseClientWrapper;
      requestResponseManager: RequestResponseManager;
      producer: HeliconeProducer;
    },
    authParams: AuthParams,
    S3_ENABLED: Env["S3_ENABLED"],
    orgRateLimit: boolean,
    requestHeaders?: HeliconeHeaders,
    cachedHeaders?: Headers,
    cacheSettings?: CacheSettings
  ): Promise<Result<null, string>> {
    if (
      !authParams?.organizationId ||
      // Must be helicone api key or proxy key
      !requestHeaders?.heliconeAuthV2 ||
      (!requestHeaders?.heliconeAuthV2?.token &&
        !this.request.heliconeProxyKeyId)
    ) {
      return err(`Auth failed! ${authParams?.organizationId}`);
    }

    const org = await db.dbWrapper.getOrganization();

    if (org.error !== null) {
      return err(org.error);
    }

    const { body: rawResponseBody, endTime: responseEndTime } =
      await this.response.getResponseBody();

    // Skip S3 storage if:
    // 1. Free tier AND limit exceeded (both conditions must be true)
    // 2. Omit request/response headers are set
    const skipS3Storage =
      (org.data.tier === "free" && org.data.freeLimitExceeded === true) ||
      requestHeaders?.omitHeaders?.omitRequest === true ||
      requestHeaders?.omitHeaders?.omitResponse === true;

    if (S3_ENABLED === "true" && !skipS3Storage) {
      try {
        const providerResponse = rawResponseBody.join("");
        let openAIResponse: string | undefined;

        // Check if this is an AI Gateway request
        const isAIGateway = this.request.attempt?.endpoint;

        if (isAIGateway) {
          const responseStatus = await this.response.status();
          if (responseStatus < 400) {
            try {
              const bodyMapping = this.request.attempt?.endpoint.userConfig?.gatewayMapping;

              // Normalize response and convert to user's requested format (OPENAI or RESPONSES)
              openAIResponse = await normalizeAIGatewayResponse({
                responseText: providerResponse,
                isStream: this.request.isStream,
                provider: this.request.attempt?.endpoint.provider ?? "openai",
                providerModelId:
                  this.request.attempt?.endpoint.providerModelId ?? "",
                responseFormat:
                  this.request.attempt?.endpoint.modelConfig.responseFormat ??
                  "OPENAI",
                bodyMapping: bodyMapping ?? "OPENAI",
              });
            } catch (e) {
              console.error("Failed to normalize AI Gateway response:", e);
              openAIResponse = providerResponse;
            }
          } else {
            openAIResponse = providerResponse;
          }
        }

        const s3Result =
          await db.requestResponseManager.storeRequestResponseRaw({
            organizationId: authParams.organizationId,
            requestId: this.request.requestId,
            requestBodyBuffer: this.request.requestBodyBuffer,
            providerResponse,
            openAIResponse,
          });

        if (s3Result.error) {
          console.error(
            `Error storing request response in S3: ${s3Result.error}`
          );
        }
      } catch (e) {
        console.error("Error preparing S3 payload:", e);
      }
    }

    const endTime = this.timing.endTime ?? responseEndTime;
    let timeToFirstToken: number | undefined =
      (await this.timing.timeToFirstToken()) ?? undefined;
    if (Number.isNaN(timeToFirstToken)) {
      timeToFirstToken = undefined;
    }

    const cacheReferenceId =
      cacheSettings?.shouldReadFromCache && cachedHeaders
        ? cachedHeaders.get("Helicone-Id")
        : DEFAULT_UUID;

    let gatewayProvider: ModelProviderName | undefined;
    let gatewayModel: string | undefined;
    let aiGatewayBodyMapping: BodyMappingType | undefined;
    if (this.request.attempt?.source && this.request.attempt?.endpoint) {
      const sourceParts = this.request.attempt?.source.split("/");
      const model = sourceParts[0];
      const provider = sourceParts[1];

      gatewayProvider = provider as ModelProviderName;
      gatewayModel = model as string;
      aiGatewayBodyMapping = this.request.attempt?.endpoint.userConfig?.gatewayMapping ?? "OPENAI";
    }

    const kafkaMessage: MessageData = {
      id: this.request.requestId,
      authorization: requestHeaders.heliconeAuthV2.token,
      heliconeMeta: {
        modelOverride: requestHeaders.modelOverride ?? undefined,
        omitRequestLog: requestHeaders.omitHeaders.omitRequest,
        omitResponseLog: requestHeaders.omitHeaders.omitResponse,
        webhookEnabled: requestHeaders.webhookEnabled,
        posthogApiKey: requestHeaders.posthogKey ?? undefined,
        lytixKey: requestHeaders.lytixKey ?? undefined,
        lytixHost: requestHeaders.lytixHost ?? undefined,
        posthogHost: requestHeaders.posthogHost ?? undefined,
        heliconeManualAccessKey:
          requestHeaders.heliconeManualAccessKey ?? undefined,
        promptId: this.request.prompt2025Settings.promptId,
        promptVersionId: this.request.prompt2025Settings.promptVersionId,
        promptInputs: this.request.prompt2025Settings.promptInputs,
        promptEnvironment: this.request.prompt2025Settings.environment,
        isPassthroughBilling: this.request.escrowInfo ? true : false,
        gatewayProvider: gatewayProvider ?? undefined,
        gatewayModel: gatewayModel ?? undefined,
        providerModelId:
          this.request.attempt?.endpoint.providerModelId ?? undefined,
        stripeCustomerId: requestHeaders.stripeCustomerId ?? undefined,
        aiGatewayBodyMapping: aiGatewayBodyMapping ?? undefined,
        // Only mark as exceeded if tier is free AND limit is exceeded
        freeLimitExceeded:
          org.data.tier === "free" && org.data.freeLimitExceeded
            ? true
            : undefined,
      },
      log: {
        request: {
          id: this.request.requestId,
          userId: this.request.userId ?? "",
          promptId:
            this.request.promptSettings.promptMode === "production"
              ? this.request.promptSettings.promptId
              : "",
          cacheReferenceId: cacheReferenceId ?? DEFAULT_UUID,
          cacheEnabled: requestHeaders.cacheHeaders.cacheEnabled ?? undefined,
          cacheSeed: requestHeaders.cacheHeaders.cacheSeed ?? undefined,
          cacheBucketMaxSize:
            requestHeaders.cacheHeaders.cacheBucketMaxSize ?? undefined,
          cacheControl: requestHeaders.cacheHeaders.cacheControl ?? undefined,
          promptVersion: this.request.promptSettings.promptVersion,
          properties: this.request.properties,
          heliconeApiKeyId: authParams.heliconeApiKeyId, // If undefined, proxy key id must be present
          heliconeProxyKeyId: this.request.heliconeProxyKeyId ?? undefined,
          targetUrl: this.request.targetUrl,
          provider: this.request.provider,
          bodySize: await this.request.requestBodyBuffer.bodyLength(),
          path: this.request.path,
          threat: this.request.threat ?? undefined,
          countryCode: this.request.country_code ?? undefined,
          requestCreatedAt: this.request.startTime ?? new Date(),
          isStream: this.request.isStream,
          heliconeTemplate: this.request.heliconeTemplate ?? undefined,
          requestReferrer: this.request.requestReferrer ?? undefined,
          experimentColumnId:
            requestHeaders.experimentHeaders.columnId ?? undefined,
          experimentRowIndex:
            requestHeaders.experimentHeaders.rowIndex ?? undefined,
        },

        response: {
          id: this.response.responseId,
          status: await this.response.status(),
          bodySize: rawResponseBody.length,
          timeToFirstToken,
          responseCreatedAt: endTime,
          delayMs: endTime.getTime() - this.timing.startTime.getTime(),
          cachedLatency:
            cacheReferenceId == DEFAULT_UUID
              ? 0
              : (() => {
                  try {
                    return Number(
                      cachedHeaders?.get("Helicone-Cache-Latency") ?? 0
                    );
                  } catch {
                    return 0;
                  }
                })(),
          cost: this.response.cost,
        },
      },
    };

    if (orgRateLimit) {
      console.log(
        `Setting lower priority for org ${authParams.organizationId} because of rate limit`
      );
      db.producer.setLowerPriority();
    }

    await db.producer.sendMessage(kafkaMessage);
    return ok(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tryParseBody(body: string, bodyType: "request" | "response"): any {
    try {
      return JSON.parse(body);
    } catch (e) {
      console.error(`Error parsing ${bodyType} body: ${e}`);
      return {
        helicone_error: `error parsing ${bodyType} body: ${e}`,
        parse_response_error: e,
        body: body,
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  omitBody(omitBody: boolean, body: any, model: string): any {
    return omitBody
      ? {
          model: model,
        }
      : body;
  }

  calculateModel(
    requestModel: string | null,
    responseModel: string | null,
    modelOverride: string | null
  ): string {
    return modelOverride ?? responseModel ?? requestModel ?? "not-found";
  }
}
