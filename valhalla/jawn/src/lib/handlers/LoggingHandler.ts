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
} from "./HandlerContext";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";
import {
  COST_PRECISION_MULTIPLIER,
  modelCost,
} from "@helicone-package/cost/costCalc";
import { normalizeTier } from "../utils/tiers";

type S3Record = {
  requestId: string;
  organizationId: string;
  requestBody: string;
  responseBody: string;
  assets: Map<string, string>;
  tier: string;
};

export type BatchPayload = {
  responses: Database["public"]["Tables"]["response"]["Insert"][];
  requests: Database["public"]["Tables"]["request"]["Insert"][];
  prompts: PromptRecord[];
  assets: Database["public"]["Tables"]["asset"]["Insert"][];
  s3Records: S3Record[];
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
      const requestMapped = this.mapRequest(context);
      const responseMapped = this.mapResponse(context);
      const assetsMapped = this.mapAssets(context).slice(0, 100);

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
        !context.orgParams.has_integrated &&
        context.orgParams.id
      ) {
        this.batchPayload.orgsToMarkAsIntegrated.add(context.orgParams.id);
      }

      // Sanitize request_body to prevent JSON parsing errors in Clickhouse
      // Special handling for the request_body field which often contains nested JSON with escape sequences
      const sanitizedRequestResponseVersionedCHMapped =
        this.sanitizeJsonEscapeSequences(requestResponseVersionedCHMapped);

      // Special handling for request_body to ensure it's properly sanitized
      if (
        typeof sanitizedRequestResponseVersionedCHMapped.request_body ===
        "string"
      ) {
        sanitizedRequestResponseVersionedCHMapped.request_body =
          sanitizedRequestResponseVersionedCHMapped.request_body.replace(
            /[\uD800-\uDFFF]/g,
            "\uFFFD"
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
      this.batchPayload.assets.push(...assetsMapped);

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

      if (s3RecordMapped) {
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
      const key = this.s3Client.getRequestResponseKey(
        s3Record.requestId,
        s3Record.organizationId
      );

      // Get tier information from context (stored in s3Record)
      const tags: Record<string, string> = {};
      tags.tier = normalizeTier(s3Record.tier);

      // Upload request and response body with tier tag
      const uploadRes = await this.s3Client.store(
        key,
        JSON.stringify({
          request: s3Record.requestBody,
          response: s3Record.responseBody,
        }),
        tags
      );

      if (uploadRes.error) {
        return err(
          `Failed to store request body for request ID ${s3Record.requestId}: ${uploadRes.error}`
        );
      }

      // Optionally upload assets if they exist
      if (s3Record.assets && s3Record.assets.size > 0) {
        const imageUploadRes = await this.storeRequestResponseImage(
          s3Record.organizationId,
          s3Record.requestId,
          s3Record.assets,
          s3Record.tier
        );

        if (imageUploadRes.error) {
          return err(
            `Failed to store request response images: ${imageUploadRes.error}`
          );
        }
      }

      return ok(`S3 upload successful for request ID ${s3Record.requestId}`);
    });

    await Promise.all(uploadPromises);

    // TODO: How to handle errors here?

    return ok("All S3 uploads successful");
  }

  private async storeRequestResponseImage(
    organizationId: string,
    requestId: string,
    assets: Map<string, string>,
    tier: string
  ): PromiseGenericResult<string> {
    const uploadPromises: Promise<void>[] = Array.from(assets.entries()).map(
      ([assetId, imageUrl]) =>
        this.handleImageUpload(assetId, imageUrl, requestId, organizationId, tier)
    );

    await Promise.allSettled(uploadPromises);

    return ok("Images uploaded successfully");
  }

  private isBase64Image(imageUrl: string): boolean {
    const MIN_BASE64_LENGTH = 24;
    const dataUriPattern = /^\s*data:image\/[a-zA-Z]+;base64,/;
    const base64OnlyPattern = /^[A-Za-z0-9+/=]+\s*$/;

    if (dataUriPattern.test(imageUrl)) {
      return true;
    }

    return (
      base64OnlyPattern.test(imageUrl) && imageUrl.length >= MIN_BASE64_LENGTH
    );
  }

  private async handleImageUpload(
    assetId: string,
    imageUrl: string,
    requestId: string,
    organizationId: string,
    tier: string
  ): Promise<void> {
    try {
      // Prepare tags
      const tags: Record<string, string> = {};
      tags.tier = normalizeTier(tier);

      if (this.isBase64Image(imageUrl)) {
        const [assetType, base64Data] = this.extractBase64Data(imageUrl);
        const buffer = Buffer.from(base64Data, "base64");
        await this.s3Client.uploadBase64ToS3(
          buffer,
          assetType,
          requestId,
          organizationId,
          assetId,
          tags
        );
      } else {
        const response = await fetch(imageUrl, {
          headers: {
            "User-Agent": "Helicone-Worker (https://helicone.ai)",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const blob = await response.blob();
        await this.s3Client.uploadImageToS3(
          blob,
          requestId,
          organizationId,
          assetId,
          tags
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      // If we fail to upload an image, we don't want to fail logging the request
    }
  }

  private extractBase64Data(dataUri: string): [string, string] {
    const dataUriRegex =
      /^data:(image\/(?:png|jpeg|jpg|gif|webp|svg\+xml));base64,([A-Za-z0-9+/=]+)$/;
    const base64Regex = /^([A-Za-z0-9+/=]+)$/;

    let matches = dataUri.match(dataUriRegex);
    if (matches && matches.length === 3) {
      return [matches[1], matches[2]];
    }

    matches = dataUri.match(base64Regex);
    if (matches && matches.length === 2) {
      return ["image/jpeg", matches[1]];
    }

    console.error("Invalid or unsupported base64 image data:", dataUri);
    return ["", ""];
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

  mapS3Records(context: HandlerContext): S3Record | null {
    const request = context.message.log.request;
    const orgParams = context.orgParams;
    const assets = context.processedLog.assets;

    if (!orgParams?.id) {
      return null;
    }

    const s3Record: S3Record = {
      requestId: request.id,
      organizationId: orgParams.id,
      requestBody: context.processedLog.request.body,
      responseBody: context.processedLog.response.body,
      assets: assets ?? new Map(),
      tier: orgParams.tier,
    };

    return s3Record;
  }

  mapAssets(
    context: HandlerContext
  ): Database["public"]["Tables"]["asset"]["Insert"][] {
    const request = context.message.log.request;
    const orgParams = context.orgParams;
    const assets = context.processedLog.assets;

    if (!orgParams?.id || !assets || assets.size === 0) {
      return [];
    }

    const assetInserts: Database["public"]["Tables"]["asset"]["Insert"][] =
      Array.from(assets.entries()).map(([assetId]) => ({
        id: assetId,
        request_id: request.id,
        organization_id: orgParams.id,
        created_at: request.requestCreatedAt.toISOString(),
      }));

    return assetInserts;
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
    const usage = context.usage;
    const orgParams = context.orgParams;
    const { requestText, responseText } =
      this.requestResponseTextFromContext(context);

    const isCacheHit =
      context.message.log.request.cacheReferenceId &&
      context.message.log.request.cacheReferenceId != DEFAULT_UUID;

    let cost = response.cost
      ? response.cost * COST_PRECISION_MULTIPLIER
      : isCacheHit
        ? 0
        : modelCost({
            provider: request.provider ?? "",
            model: context.processedLog.model ?? "",
            sum_prompt_tokens: usage.promptTokens ?? 0,
            sum_completion_tokens: usage.completionTokens ?? 0,
            prompt_cache_write_tokens: usage.promptCacheWriteTokens ?? 0,
            prompt_cache_read_tokens: usage.promptCacheReadTokens ?? 0,
            prompt_audio_tokens: usage.promptAudioTokens ?? 0,
            completion_audio_tokens: usage.completionAudioTokens ?? 0,
            sum_tokens:
              (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0),
            multiple: COST_PRECISION_MULTIPLIER,
          });
    if (cost < 0) {
      cost = 0;
    }
    const requestResponseLog: RequestResponseRMT = {
      user_id:
        typeof request.userId === "string"
          ? request.userId
          : String(request.userId),
      request_id: request.id,
      completion_tokens: isCacheHit ? 0 : (usage.completionTokens ?? 0),
      latency: response.delayMs ?? 0,
      model: context.processedLog.model ?? "",
      prompt_tokens: isCacheHit ? 0 : (usage.promptTokens ?? 0),
      prompt_cache_write_tokens: isCacheHit
        ? 0
        : (usage.promptCacheWriteTokens ?? 0),
      prompt_cache_read_tokens: isCacheHit
        ? 0
        : (usage.promptCacheReadTokens ?? 0),
      prompt_audio_tokens: isCacheHit ? 0 : (usage.promptAudioTokens ?? 0),
      completion_audio_tokens: isCacheHit
        ? 0
        : (usage.completionAudioTokens ?? 0),
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
      provider: request.provider ?? "",
      country_code: request.countryCode ?? "",
      properties: context.processedLog.request.properties ?? {},
      assets: context.processedLog.assets
        ? Array.from(context.processedLog.assets.keys())
        : [],
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
      is_passthrough_billing: context.message.heliconeMeta.isPassthroughBilling ?? false,
    };

    return requestResponseLog;
  }

  mapCacheMetricCH(context: HandlerContext): CacheMetricSMT {
    const { requestText, responseText } =
      this.requestResponseTextFromContext(context);

    const request = context.message.log.request;
    const response = context.message.log.response;
    const usage = context.usage;
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
      saved_completion_tokens: usage.completionTokens ?? 0,
      saved_prompt_tokens: usage.promptTokens ?? 0,
      saved_prompt_cache_write_tokens: usage.promptCacheWriteTokens ?? 0,
      saved_prompt_cache_read_tokens: usage.promptCacheReadTokens ?? 0,
      saved_prompt_audio_tokens: usage.promptAudioTokens ?? 0,
      saved_completion_audio_tokens: usage.completionAudioTokens ?? 0,
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
      const mappedContent = heliconeRequestToMappedContent(
        toHeliconeRequest(context)
      );
      return {
        requestText:
          mappedContent.preview?.fullRequestText?.() ??
          JSON.stringify(mappedContent.raw.request),
        responseText:
          mappedContent.preview?.fullResponseText?.() ??
          JSON.stringify(mappedContent.raw.request),
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
   * @param obj - The object to sanitize
   * @returns A sanitized copy of the object
   */
  private sanitizeJsonEscapeSequences<T>(obj: T): T {
    // Create a deep copy of the object through serialization
    // and replace any invalid surrogate pairs
    try {
      const sanitizedJson = JSON.stringify(obj, (_, value) => {
        if (typeof value === "string") {
          // Replace any lone surrogate halves with the Unicode replacement character (U+FFFD)
          return value.replace(/[\uD800-\uDFFF]/g, "\uFFFD");
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

  mapResponse(
    context: HandlerContext
  ): Database["public"]["Tables"]["response"]["Insert"] {
    const response = context.message.log.response;
    const processedResponse = context.processedLog.response;
    const orgParams = context.orgParams;

    // Sanitize delay_ms to prevent PostgreSQL integer overflow
    const sanitizedDelayMs = this.sanitizeDelayMs(response.delayMs);

    const responseInsert: Database["public"]["Tables"]["response"]["Insert"] = {
      id: response.id,
      request: context.message.log.request.id,
      helicone_org_id: orgParams?.id ?? null,
      status: response.status,
      model: processedResponse.model,
      completion_tokens: context.usage.completionTokens,
      prompt_tokens: context.usage.promptTokens,
      prompt_cache_write_tokens: context.usage.promptCacheWriteTokens,
      prompt_cache_read_tokens: context.usage.promptCacheReadTokens,
      time_to_first_token: response.timeToFirstToken,
      delay_ms: sanitizedDelayMs,
      created_at: response.responseCreatedAt.toISOString(),
    };

    return responseInsert;
  }

  mapRequest(
    context: HandlerContext
  ): Database["public"]["Tables"]["request"]["Insert"] {
    const request = context.message.log.request;
    const orgParams = context.orgParams;
    const authParams = context.authParams;
    const heliconeMeta = context.message.heliconeMeta;
    const processedRequest = context.processedLog.request;

    const requestInsert: Database["public"]["Tables"]["request"]["Insert"] = {
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

  private ensureMaxVectorLength = (text: string): string => {
    const maxBytes = 512000; // ~500k less than 1MB for buffer
    text = text.replace(/[^\x00-\x7F]/g, "");
    text = text.trim();

    let buffer = Buffer.from(text, "utf-8");

    if (buffer.length <= maxBytes) {
      return text;
    }

    let truncatedBuffer = Buffer.alloc(maxBytes);
    buffer.copy(truncatedBuffer, 0, 0, maxBytes);

    let endIndex = maxBytes;
    while (endIndex > 0 && truncatedBuffer[endIndex - 1] >> 6 === 2) {
      endIndex--;
    }

    const truncatedText = truncatedBuffer.toString("utf-8", 0, endIndex);

    return truncatedText;
  };

  cleanBody(body: string): string {
    return body.replace(/\u0000/g, "");
  }

  private vectorizeModel = (model: string): boolean => {
    if (!model) {
      return false;
    }
    const nonVectorizedModels: Set<string> = new Set(["dall-e-2", "dall-e-3"]);
    return !nonVectorizedModels.has(model);
  };
}
