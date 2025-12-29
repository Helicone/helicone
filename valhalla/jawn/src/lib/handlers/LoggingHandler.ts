import { heliconeRequestToMappedContent } from "@helicone-package/llm-mapper/utils/getMappedContent";
import {
  CacheMetricSMT,
  formatTimeString,
  RequestResponseRMT,
  Prompt2025Input,
} from "../db/ClickhouseWrapper";
import { Database } from "../db/database.types";
import { S3Client } from "../shared/db/s3Client";
import {
  err,
  ok,
  PromiseGenericResult,
  Result,
} from "../../packages/common/result";
import { LogStore } from "../stores/LogStore";
import { VersionedRequestStore } from "../stores/request/VersionedRequestStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import {
  ExperimentCellValue,
  HandlerContext,
  PromptRecord,
  toHeliconeRequest,
  getPromptTokens,
  getCompletionTokens,
  getPromptCacheWriteTokens,
  getPromptCacheReadTokens,
  getPromptAudioTokens,
  getCompletionAudioTokens,
} from "./HandlerContext";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { atLeastZero } from "../utils/helicone_math";
import { tryToGetSize } from "../../utils/tryGetSize";
import { replaceLoneSurrogates } from "../../utils/sanitize";

type RequestRecord = {
  requestId: string;
  organizationId: string;
  requestBody: string;
  responseBody: string;
  location: "s3" | "clickhouse";
};

// Legacy type definitions for deleted tables
export interface ResponseInsert {
  id: string;
  request: string;
  helicone_org_id: string | null;
  status: number | null;
  model: string | null | undefined;
  completion_tokens: number | null | undefined;
  prompt_tokens: number | null | undefined;
  prompt_cache_write_tokens?: number | null | undefined;
  prompt_cache_read_tokens?: number | null | undefined;
  time_to_first_token: number | null | undefined;
  delay_ms: number | null | undefined;
  created_at: string;
}

export interface RequestInsert {
  id: string;
  path: string;
  auth_hash: string;
  user_id: string | null;
  prompt_id: string | null;
  properties: Record<string, string>;
  helicone_user: string | null;
  helicone_api_key_id: number | null;
  helicone_org_id: string | null;
  provider: string;
  helicone_proxy_key_id: string | null;
  model: string | null | undefined;
  model_override: string | null;
  threat: boolean | null;
  target_url: string;
  country_code: string | null;
  created_at: string;
}

export interface AssetInsert {
  id: string;
  request_id: string;
  organization_id: string;
  created_at: string;
}

export type BatchPayload = {
  responses: ResponseInsert[];
  requests: RequestInsert[];
  prompts: PromptRecord[];
  assets: AssetInsert[];
  s3Records: RequestRecord[];
  requestResponseVersionedCH: RequestResponseRMT[];
  cacheMetricCH: CacheMetricSMT[];
  promptInputs: Prompt2025Input[];
  experimentCellValues: ExperimentCellValue[];
  scores: {
    organizationId: string;
    requestId: string;
    scores: Record<string, number | boolean | undefined>;
    evaluatorIds: Record<string, string>;
  }[];
  orgsToMarkAsIntegrated: Set<string>;
};

const HELICONE_PLAYGROUND_USER_ID = "helicone_playground";
const avgTokenLength = 4;
const maxContentLength = 2_000_000;
const maxResponseLength = 100_000;
const MAX_CONTENT_LENGTH = maxContentLength * avgTokenLength; // 2 MB
const MAX_RESPONSE_LENGTH = maxResponseLength * avgTokenLength; // 100k

const S3_MIN_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB in bytes

function cleanAndTruncateString(text: string, maxLength: number): string {
  return text
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .trim()
    .slice(0, maxLength);
}

export class LoggingHandler extends AbstractLogHandler {
  private batchPayload: BatchPayload;
  private logStore: LogStore;
  private requestStore: VersionedRequestStore;
  private s3Client: S3Client;

  constructor(
    logStore: LogStore,
    requestStore: VersionedRequestStore,
    s3Client: S3Client
  ) {
    super();
    this.logStore = logStore;
    this.requestStore = requestStore;
    this.s3Client = s3Client;
    this.batchPayload = {
      responses: [],
      requests: [],
      prompts: [], // LEGACY PROMPT RECORDS
      promptInputs: [],
      assets: [],
      s3Records: [],
      requestResponseVersionedCH: [],
      cacheMetricCH: [],

      experimentCellValues: [],
      scores: [],
      orgsToMarkAsIntegrated: new Set<string>(),
    };
  }

  async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });
    // Perform all mappings first and check for failures before updating the batch payload
    try {
      // rough estimate of size
      const size = tryToGetSize({
        b1: context.processedLog.request.body,
        b2: context.processedLog.response.body,
      });

      context.sizeBytes = size ?? 0;
      // if we know size is def less than 10mb use clickhouse otherwise just stick to s3
      context.storageLocation =
        size && size <= S3_MIN_SIZE_THRESHOLD ? "clickhouse" : "s3";

      const requestMapped = this.mapRequest(context);
      const responseMapped = this.mapResponse(context);

      const s3RecordMapped = this.mapS3Records(context);

      // MAP LEGACY PROMPT RECORDS
      const promptMapped =
        context.message.log.request.promptId &&
        context.processedLog.request.heliconeTemplate
          ? this.mapPrompt(context)
          : null;
      const experimentCellValueMapped = this.mapExperimentCellValues(context);
      const requestResponseVersionedCHMapped =
        this.mapRequestResponseVersionedCH(context);

      if (
        requestMapped.user_id !== HELICONE_PLAYGROUND_USER_ID &&
        context.orgParams &&
        (!context.orgParams.has_integrated ||
          !context.orgParams.has_onboarded) &&
        context.orgParams.id
      ) {
        this.batchPayload.orgsToMarkAsIntegrated.add(context.orgParams.id);
      }

      // Sanitize request_body to prevent JSON parsing errors in Clickhouse
      // Special handling for the request_body field which often contains nested JSON with escape sequences
      const sanitizedRequestResponseVersionedCHMapped =
        this.sanitizeJsonEscapeSequences(requestResponseVersionedCHMapped);

      // Special handling for request_body to ensure it's properly sanitized
      // Only replace lone surrogates, preserving valid emoji surrogate pairs
      if (
        typeof sanitizedRequestResponseVersionedCHMapped.request_body ===
        "string"
      ) {
        sanitizedRequestResponseVersionedCHMapped.request_body =
          replaceLoneSurrogates(
            sanitizedRequestResponseVersionedCHMapped.request_body
          );
      }

      const promptInput = this.mapPromptInput(context);
      if (context.message.heliconeMeta.promptId && promptInput) {
        this.batchPayload.promptInputs.push(promptInput);
      }

      const loggingCacheHit =
        context.message.log.request.cacheReferenceId != DEFAULT_UUID;
      if (loggingCacheHit) {
        const sanitizedCacheMetricCHMapped = this.sanitizeJsonEscapeSequences(
          this.mapCacheMetricCH(context)
        );
        this.batchPayload.cacheMetricCH.push(sanitizedCacheMetricCHMapped);
      }

      this.batchPayload.requests.push(requestMapped);
      this.batchPayload.responses.push(responseMapped);

      if (
        context.processedLog.request.scores &&
        Object.keys(context.processedLog.request.scores).length > 0
      ) {
        this.batchPayload.scores.push({
          organizationId: context.orgParams?.id ?? "",
          requestId: requestMapped.id ?? "",
          scores: context.processedLog.request.scores ?? {},
          evaluatorIds: context.processedLog.request.scores_evaluatorIds ?? {},
        });
      }

      if (s3RecordMapped && context.storageLocation === "s3") {
        this.batchPayload.s3Records.push(s3RecordMapped);
      }

      if (promptMapped) {
        this.batchPayload.prompts.push(promptMapped);
      }

      if (experimentCellValueMapped) {
        this.batchPayload.experimentCellValues.push(experimentCellValueMapped);
      }

      this.batchPayload.requestResponseVersionedCH.push(
        sanitizedRequestResponseVersionedCHMapped
      );

      return await super.handle(context);
    } catch (error: any) {
      return err(
        `Failed to map data: ${error.message}, Context: ${this.constructor.name}`
      );
    }
  }

  public async handleResults(): Promise<
    Result<
      string,
      {
        pgError?: string;
        s3Error?: string;
        chError?: string;
      }
    >
  > {
    const [pgResult, s3Result, chResult] = await Promise.all([
      this.logStore.insertLogBatch(this.batchPayload),
      this.uploadToS3(),
      this.logToClickhouse(),
    ]);

    if (pgResult.error) {
      return err({
        pgError: `Error inserting logs to Postgres: ${pgResult.error}`,
      });
    }

    if (s3Result.error) {
      return err({
        s3Error: `Error inserting logs to S3: ${s3Result.error}`,
      });
    }

    if (chResult.error) {
      return err({
        chError: `Error inserting logs to Clickhouse: ${chResult.error}`,
      });
    }

    return ok("Successfully inserted logs");
  }

  async uploadToS3(): PromiseGenericResult<string> {
    const uploadPromises = this.batchPayload.s3Records.map(async (s3Record) => {
      if (s3Record.location === "clickhouse") {
        return ok(
          `Skipping S3 upload for request ID ${s3Record.requestId} as location is clickhouse`
        );
      }
      const key = this.s3Client.getRequestResponseKey(
        s3Record.requestId,
        s3Record.organizationId
      );

      // Upload request and response body
      const uploadRes = await this.s3Client.store(
        key,
        JSON.stringify({
          request: s3Record.requestBody,
          response: s3Record.responseBody,
        })
      );

      if (uploadRes.error) {
        return err(
          `Failed to store request body for request ID ${s3Record.requestId}: ${uploadRes.error}`
        );
      }

      // Note: Assets are no longer uploaded to S3, they remain in request/response bodies as raw data

      return ok(`S3 upload successful for request ID ${s3Record.requestId}`);
    });

    await Promise.all(uploadPromises);

    // TODO: How to handle errors here?

    return ok("All S3 uploads successful");
  }

  async logToClickhouse(): PromiseGenericResult<string> {
    try {
      if (
        Array.isArray(this.batchPayload.requestResponseVersionedCH) &&
        this.batchPayload.requestResponseVersionedCH.length > 0
      ) {
        const result = await this.requestStore.insertRequestResponseVersioned(
          this.batchPayload.requestResponseVersionedCH
        );
        if (result.error) {
          return err(`Error inserting request response logs: ${result.error}`);
        }
      }

      if (this.batchPayload.cacheMetricCH.length > 0) {
        const cacheResult = await this.requestStore.insertCacheMetricVersioned(
          this.batchPayload.cacheMetricCH
        );

        if (cacheResult.error) {
          return err(`Error inserting cache metric logs: ${cacheResult.error}`);
        }
      }

      return ok("All logs inserted successfully.");
    } catch (error: any) {
      return err(
        `Unexpected error during logging to Clickhouse: ${
          error.message ?? "No error message provided"
        }`
      );
    }
  }

  mapS3Records(context: HandlerContext): RequestRecord | null {
    const request = context.message.log.request;
    const orgParams = context.orgParams;

    if (!orgParams?.id) {
      return null;
    }

    const s3Record: RequestRecord = {
      requestId: request.id,
      organizationId: orgParams.id,
      requestBody: context.processedLog.request.body,
      responseBody: context.processedLog.response.body,
      location: context.storageLocation ?? "s3",
    };

    return s3Record;
  }

  mapExperimentCellValues(context: HandlerContext): ExperimentCellValue | null {
    const request = context.message.log.request;
    const experimentColumnId = request.experimentColumnId;
    const experimentRowIndex = request.experimentRowIndex;

    if (!experimentColumnId || !experimentRowIndex) {
      return null;
    }

    return {
      columnId: experimentColumnId,
      rowIndex: parseInt(experimentRowIndex),
      value: request.id,
    };
  }

  // USED TO MAP LEGACY PROMPT RECORDS
  mapPrompt(context: HandlerContext): PromptRecord | null {
    if (
      !context.message.log.request.promptId ||
      !context.orgParams?.id ||
      !context.processedLog.request.heliconeTemplate
    ) {
      return null;
    }
    if (Array.isArray(context.processedLog.request.heliconeTemplate.template)) {
      context.processedLog.request.heliconeTemplate.template = {
        error: "Invalid helicone template",
        message: "Helicone template is an array",
      };
    }

    const promptRecord: PromptRecord = {
      promptId: context.message.log.request.promptId,
      promptVersion: context.message.log.request.promptVersion ?? "",
      requestId: context.message.log.request.id,
      orgId: context.orgParams.id,
      model: context.processedLog.model,
      heliconeTemplate: context.processedLog.request.heliconeTemplate,
      createdAt: context.message.log.request.requestCreatedAt,
      provider: context.message.log.request.provider,
    };

    return promptRecord;
  }

  mapPromptInput(context: HandlerContext): Prompt2025Input | null {
    const request_id = context.message.log.request.id;
    const version_id = context.message.heliconeMeta.promptVersionId;
    const inputs = context.message.heliconeMeta.promptInputs;
    const environment = context.message.heliconeMeta.promptEnvironment;

    if (!version_id || !inputs) {
      return null;
    }

    const promptInputsLog: Prompt2025Input = {
      request_id,
      version_id,
      inputs,
      environment,
    };

    return promptInputsLog;
  }

  mapRequestResponseVersionedCH(context: HandlerContext): RequestResponseRMT {
    const request = context.message.log.request;
    const response = context.message.log.response;
    const legacyUsage = context.legacyUsage;
    const modelUsage = context.usage;
    const promptTokens = atLeastZero(
      getPromptTokens(modelUsage, legacyUsage) ?? 0
    );
    const completionTokens = atLeastZero(
      getCompletionTokens(modelUsage, legacyUsage) ?? 0
    );
    const promptCacheWriteTokens = atLeastZero(
      getPromptCacheWriteTokens(modelUsage, legacyUsage) ?? 0
    );
    const promptCacheReadTokens = atLeastZero(
      getPromptCacheReadTokens(modelUsage, legacyUsage) ?? 0
    );
    const promptAudioTokens = atLeastZero(
      getPromptAudioTokens(modelUsage, legacyUsage) ?? 0
    );
    const completionAudioTokens = atLeastZero(
      getCompletionAudioTokens(modelUsage, legacyUsage) ?? 0
    );
    const orgParams = context.orgParams;
    const { requestText, responseText } =
      this.requestResponseTextFromContext(context);

    const isCacheHit =
      context.message.log.request.cacheReferenceId &&
      context.message.log.request.cacheReferenceId != DEFAULT_UUID;

    let rawCost;
    // For requests on the new AI Gateway, both PTB and BYOK, we want to
    // set cost to zero if we cannot calculate it from the new usage processor+registry
    // rather than falling back to legacy usage cost
    if (context.message.heliconeMeta.providerModelId) {
      rawCost = atLeastZero(context.costBreakdown?.totalCost ?? 0);
    } else {
      rawCost = atLeastZero(
        context.costBreakdown?.totalCost ?? context.legacyUsage.cost ?? 0
      );
    }
    const cost = Math.round(rawCost * COST_PRECISION_MULTIPLIER);

    const requestResponseLog: RequestResponseRMT = {
      user_id:
        typeof request.userId === "string"
          ? request.userId
          : String(request.userId),
      request_id: request.id,
      latency: response.delayMs ?? 0,
      model:
        context.message.heliconeMeta.gatewayModel ??
        context.processedLog.model ??
        "",
      completion_tokens: atLeastZero(isCacheHit ? 0 : completionTokens),
      prompt_tokens: atLeastZero(isCacheHit ? 0 : promptTokens),
      prompt_cache_write_tokens: atLeastZero(
        isCacheHit ? 0 : promptCacheWriteTokens
      ),
      prompt_cache_read_tokens: atLeastZero(
        isCacheHit ? 0 : promptCacheReadTokens
      ),
      prompt_audio_tokens: atLeastZero(isCacheHit ? 0 : promptAudioTokens),
      completion_audio_tokens: atLeastZero(
        isCacheHit ? 0 : completionAudioTokens
      ),
      cost: cost,
      request_created_at: formatTimeString(
        request.requestCreatedAt.toISOString()
      ),
      response_created_at: response.responseCreatedAt
        ? formatTimeString(response.responseCreatedAt.toISOString())
        : "",
      response_id: response.id ?? "",
      status: response.status ?? 0,
      organization_id: orgParams?.id ?? "00000000-0000-0000-0000-000000000000",
      proxy_key_id:
        request.heliconeProxyKeyId ?? "00000000-0000-0000-0000-000000000000",
      threat: request.threat ?? false,
      time_to_first_token: Math.round(response.timeToFirstToken ?? 0),
      target_url: request.targetUrl ?? "",
      provider:
        context.message.heliconeMeta.gatewayProvider ?? request.provider ?? "",
      country_code: request.countryCode ?? "",
      properties: context.processedLog.request.properties ?? {},
      assets: [],
      scores: Object.fromEntries(
        Object.entries(context.processedLog.request.scores ?? {}).map(
          ([key, value]) => [key, +(value ?? 0)]
        )
      ),
      request_body: requestText,
      response_body: responseText,
      cache_reference_id:
        context.message.log.request.cacheReferenceId ?? undefined,
      cache_enabled: context.message.log.request.cacheEnabled ?? false,
      prompt_id: context.message.heliconeMeta.promptId ?? "",
      prompt_version: context.message.heliconeMeta.promptVersionId ?? "",
      request_referrer: context.message.log.request.requestReferrer ?? "",
      is_passthrough_billing:
        context.message.heliconeMeta.isPassthroughBilling ?? false,
      ai_gateway_body_mapping:
        context.message.heliconeMeta.aiGatewayBodyMapping ?? "",
      storage_location: context.storageLocation ?? "s3",
      size_bytes: context.sizeBytes ?? 0,
    };

    return requestResponseLog;
  }

  mapCacheMetricCH(context: HandlerContext): CacheMetricSMT {
    const { requestText, responseText } =
      this.requestResponseTextFromContext(context);

    const request = context.message.log.request;
    const response = context.message.log.response;
    const legacyUsage = context.legacyUsage;
    const modelUsage = context.usage;
    const promptTokens = atLeastZero(
      getPromptTokens(modelUsage, legacyUsage) ?? 0
    );
    const completionTokens = atLeastZero(
      getCompletionTokens(modelUsage, legacyUsage) ?? 0
    );
    const promptCacheWriteTokens = atLeastZero(
      getPromptCacheWriteTokens(modelUsage, legacyUsage) ?? 0
    );
    const promptCacheReadTokens = atLeastZero(
      getPromptCacheReadTokens(modelUsage, legacyUsage) ?? 0
    );
    const promptAudioTokens = atLeastZero(
      getPromptAudioTokens(modelUsage, legacyUsage) ?? 0
    );
    const completionAudioTokens = atLeastZero(
      legacyUsage.completionAudioTokens ?? 0
    );
    const orgParams = context.orgParams;

    const cacheMetricLog: CacheMetricSMT = {
      organization_id: orgParams?.id ?? "00000000-0000-0000-0000-000000000000",
      date: response.responseCreatedAt.toISOString().split("T")[0],
      hour: response.responseCreatedAt.getUTCHours(),
      request_id: context.message.log.request.cacheReferenceId ?? DEFAULT_UUID,
      model: context.processedLog.model ?? "",
      provider: request.provider ?? "",
      cache_hit_count: 1,
      saved_latency_ms: context.message.log.response.cachedLatency ?? 0,
      saved_completion_tokens: atLeastZero(completionTokens),
      saved_prompt_tokens: atLeastZero(promptTokens),
      saved_prompt_cache_write_tokens: atLeastZero(promptCacheWriteTokens),
      saved_prompt_cache_read_tokens: atLeastZero(promptCacheReadTokens),
      saved_prompt_audio_tokens: atLeastZero(promptAudioTokens),
      saved_completion_audio_tokens: atLeastZero(completionAudioTokens),
      last_hit: formatTimeString(response.responseCreatedAt.toISOString()),
      first_hit: formatTimeString(response.responseCreatedAt.toISOString()),
      request_body: requestText,
      response_body: responseText,
    };

    return cacheMetricLog;
  }

  requestResponseTextFromContext(context: HandlerContext): {
    requestText: string;
    responseText: string;
  } {
    try {
      if (context.storageLocation === "clickhouse") {
        return {
          requestText: JSON.stringify(context.processedLog.request.body),
          responseText: JSON.stringify(context.processedLog.response.body),
        };
      }
      const mappedContent = heliconeRequestToMappedContent(
        toHeliconeRequest(context)
      );
      const requestText =
        mappedContent.preview?.fullRequestText?.() ??
        JSON.stringify(mappedContent.raw.request);

      const responseText =
        mappedContent.preview?.fullResponseText?.() ??
        JSON.stringify(mappedContent.raw.response);

      return {
        requestText: cleanAndTruncateString(requestText, MAX_CONTENT_LENGTH),
        responseText: cleanAndTruncateString(responseText, MAX_RESPONSE_LENGTH),
      };
    } catch (error) {
      console.error("Error mapping request/response for preview:", error);
      return { requestText: "", responseText: "" };
    }
  }

  /**
   * Sanitizes delay_ms to prevent PostgreSQL integer overflow
   * PostgreSQL integer (INT) max value is 2,147,483,647
   * @param delay_ms - The delay value to sanitize
   * @returns A sanitized delay value that won't cause integer overflow
   */
  private sanitizeDelayMs(
    delay_ms: number | null | undefined
  ): number | null | undefined {
    if (delay_ms === null || delay_ms === undefined) {
      return delay_ms;
    }

    if (typeof delay_ms !== "number") {
      return delay_ms;
    }

    // PostgreSQL integer (INT) max value is 2,147,483,647
    const MAX_SAFE_INT = 2147483647;

    if (delay_ms > MAX_SAFE_INT) {
      console.warn(
        `Capping delay_ms value from ${delay_ms} to ${MAX_SAFE_INT} to prevent integer overflow`
      );
      return MAX_SAFE_INT;
    }

    if (delay_ms < -MAX_SAFE_INT) {
      console.warn(
        `Capping negative delay_ms value from ${delay_ms} to ${-MAX_SAFE_INT} to prevent integer overflow`
      );
      return -MAX_SAFE_INT;
    }

    return delay_ms;
  }

  /**
   * Sanitizes JSON data by removing invalid escape sequences
   * This is needed to fix the "missing second part of surrogate pair" error
   * Only replaces lone surrogates, preserving valid emoji surrogate pairs
   * @param obj - The object to sanitize
   * @returns A sanitized copy of the object
   */
  private sanitizeJsonEscapeSequences<T>(obj: T): T {
    // Create a deep copy of the object through serialization
    // and replace only lone (unpaired) surrogates, preserving valid emoji pairs
    try {
      const sanitizedJson = JSON.stringify(obj, (_, value) => {
        if (typeof value === "string") {
          // Replace only lone surrogate halves with the Unicode replacement character (U+FFFD)
          // Valid surrogate pairs (emojis) are preserved
          return replaceLoneSurrogates(value);
        }
        return value;
      });
      return JSON.parse(sanitizedJson);
    } catch (error) {
      // If any error occurs during sanitization, return the original object
      console.warn("Failed to sanitize JSON data:", error);
      return obj;
    }
  }

  mapResponse(context: HandlerContext): ResponseInsert {
    const response = context.message.log.response;
    const processedResponse = context.processedLog.response;
    const orgParams = context.orgParams;

    // Sanitize delay_ms to prevent PostgreSQL integer overflow
    const sanitizedDelayMs = this.sanitizeDelayMs(response.delayMs);

    const promptCacheWriteTokens = getPromptCacheWriteTokens(
      context.usage,
      context.legacyUsage
    );
    const promptCacheReadTokens = getPromptCacheReadTokens(
      context.usage,
      context.legacyUsage
    );
    const responseInsert: ResponseInsert = {
      id: response.id,
      request: context.message.log.request.id,
      helicone_org_id: orgParams?.id ?? null,
      status: response.status,
      model: processedResponse.model,
      completion_tokens:
        context.usage?.output ?? context.legacyUsage.completionTokens,
      prompt_tokens: context.usage?.input ?? context.legacyUsage.promptTokens,
      prompt_cache_write_tokens: promptCacheWriteTokens,
      prompt_cache_read_tokens: promptCacheReadTokens,
      time_to_first_token: response.timeToFirstToken,
      delay_ms: sanitizedDelayMs,
      created_at: response.responseCreatedAt.toISOString(),
    };

    return responseInsert;
  }

  mapRequest(context: HandlerContext): RequestInsert {
    const request = context.message.log.request;
    const orgParams = context.orgParams;
    const authParams = context.authParams;
    const heliconeMeta = context.message.heliconeMeta;
    const processedRequest = context.processedLog.request;

    const requestInsert: RequestInsert = {
      id: request.id,
      path: request.path,
      auth_hash: "",
      user_id: request.userId ?? null,
      prompt_id: request.promptId ?? null,
      properties: processedRequest.properties ?? {},
      helicone_user: authParams?.userId ?? null,
      helicone_api_key_id: authParams?.heliconeApiKeyId ?? null,
      helicone_org_id: orgParams?.id ?? null,
      provider: request.provider ?? "",
      helicone_proxy_key_id: request.heliconeProxyKeyId ?? null,
      model: processedRequest.model,
      model_override: heliconeMeta.modelOverride ?? null,
      threat: request.threat ?? null,
      target_url: request.targetUrl,
      country_code: request?.countryCode ?? null,
      created_at: request.requestCreatedAt.toISOString(),
    };

    return requestInsert;
  }
  cleanBody(body: string): string {
    return body.replace(/\u0000/g, "");
  }
}
