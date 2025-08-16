import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { HeliconeRequest, Provider } from "@helicone-package/llm-mapper/types";
import { SetOnce } from "../../utils/setOnce";
import { AuthParams } from "../../packages/common/auth/types";
import { OrgParams } from "../../packages/common/auth/types";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";

export class HandlerContext extends SetOnce {
  public message: KafkaMessageContents;
  public authParams?: AuthParams;
  public orgParams?: OrgParams;
  public usage: Usage;
  public rawLog: RawLog;
  public processedLog: ProcessedLog;

  constructor(message: KafkaMessageContents) {
    super();
    this.message = message;
    this.processedLog = {
      request: {},
      response: {},
    };
    this.usage = {};
    this.rawLog = {};
  }
}

export type Log = {
  request: {
    id: string;
    userId: string;
    promptId?: string;
    promptVersion?: string;
    properties: Record<string, string>;
    heliconeApiKeyId?: number;
    heliconeProxyKeyId?: string;
    targetUrl: string;
    provider: Provider;
    bodySize: number;
    path: string;
    threat?: boolean;
    countryCode?: string;
    requestCreatedAt: Date;
    isStream: boolean;
    heliconeTemplate?: TemplateWithInputs;
    experimentColumnId?: string;
    experimentRowIndex?: string;
    cacheEnabled?: boolean;
    cacheSeed?: number;
    cacheBucketMaxSize?: number;
    cacheControl?: string;
    cacheReferenceId?: string;
    requestReferrer?: string;
  };
  response: {
    id: string;
    status: number;
    bodySize: number;
    timeToFirstToken?: number;
    responseCreatedAt: Date;
    delayMs: number;
    cachedLatency?: number;
  };
};

export type Usage = {
  promptTokens?: number;
  promptCacheWriteTokens?: number;
  promptCacheReadTokens?: number;
  promptAudioTokens?: number;
  completionTokens?: number;
  completionAudioTokens?: number;
  totalTokens?: number;
  heliconeCalculated?: boolean;
  cost?: number;
};

export type RawLog = {
  rawRequestBody?: string;
  rawResponseBody?: string;
};

export type ProcessedLog = {
  model?: string;
  assets?: Map<string, string>;
  request: {
    model?: string;
    body?: any;
    heliconeTemplate?: TemplateWithInputs;
    assets?: Map<string, string>;
    properties?: Record<string, string>;
    scores?: Record<string, number | boolean | undefined>;
    scores_evaluatorIds?: Record<string, string>;
  };
  response: {
    model?: string;
    body?: any;
    assets?: Map<string, string>;
  };
};

export type HeliconeMeta = {
  modelOverride?: string;
  omitRequestLog: boolean;
  omitResponseLog: boolean;
  webhookEnabled: boolean;
  posthogApiKey?: string;
  posthogHost?: string;
  lytixKey?: string;
  lytixHost?: string;
  promptId?: string;
  promptEnvironment?: string;
  promptVersionId?: string;
  promptInputs?: Record<string, any>;
  heliconeManualAccessKey?: string;
  gatewayRouterId?: string;
  gatewayDeploymentTarget?: string;
};

export type KafkaMessageContents = {
  authorization: string;
  heliconeMeta: HeliconeMeta;
  log: Log;
};

export type HeliconeScoresMessage = {
  requestId: string;
  organizationId: string;
  scores: {
    score_attribute_key: string;
    score_attribute_type: "number" | "boolean";
    score_attribute_value: number;
  }[];
  createdAt: Date;
};

export type PromptRecord = {
  promptId: string;
  promptVersion: string;
  orgId: string;
  requestId: string;
  model?: string;
  heliconeTemplate: TemplateWithInputs;
  createdAt: Date;
  provider?: Provider;
};

export type ExperimentCellValue = {
  columnId: string;
  rowIndex: number;
  value: string;
};

export const toHeliconeRequest = (context: HandlerContext): HeliconeRequest => {
  const isCacheHit =
    context.message.log.request.cacheReferenceId != DEFAULT_UUID;
  return {
    cost: context.usage.cost ?? null,
    request_body: context.processedLog.request.body,
    response_body: context.processedLog.response.body,
    request_id: context.message.log.request.id,
    response_id: context.message.log.response.id,
    request_created_at:
      context.message.log.request.requestCreatedAt.toISOString(),
    response_created_at:
      context.message.log.response.responseCreatedAt.toISOString(),
    response_status: context.message.log.response.status,
    request_model: context.processedLog.request.model ?? null,
    response_model: null,
    request_path: context.message.log.request.path,
    request_user_id: context.message.log.request.userId ?? null,
    request_properties: context.message.log.request.properties ?? null,
    model_override: null,
    helicone_user: null,
    provider: context.message.log.request.provider,
    delay_ms: context.message.log.response.delayMs ?? null,
    time_to_first_token: context.message.log.response.timeToFirstToken ?? null,

    // We don't track tokens on cache hits, since cost is 0
    total_tokens: isCacheHit ? 0 : (context.usage.totalTokens ?? null),
    prompt_tokens: isCacheHit ? 0 : (context.usage.promptTokens ?? null),
    completion_tokens: isCacheHit
      ? 0
      : (context.usage.completionTokens ?? null),
    prompt_cache_write_tokens: isCacheHit
      ? 0
      : (context.usage.promptCacheWriteTokens ?? null),
    prompt_cache_read_tokens: isCacheHit
      ? 0
      : (context.usage.promptCacheReadTokens ?? null),
    prompt_audio_tokens: isCacheHit
      ? 0
      : (context.usage.promptAudioTokens ?? null),
    completion_audio_tokens: isCacheHit
      ? 0
      : (context.usage.completionAudioTokens ?? null),

    /// NOTE: Unfortunately our codebase is running two prompts systems in parallel.
    // This used to track the legacy feature, but its now the new one.
    // It does not matter:
    // - this function is used to pull request and response bodies (no overlap with prompt IDs)
    // - evals, which is deprecated and does not seem to access this field.
    // When the legacy prompts and evals is deprecated, we should strongly consider refactoring and/or deleting this function.
    prompt_id: context.message.heliconeMeta.promptId ?? null, // TRACKS LEGACY PROMPTS ID
    prompt_version: context.message.heliconeMeta.promptVersionId ?? null, // TRACKS LEGACY PROMPT VERSION ID
    llmSchema: null,
    country_code: context.message.log.request.countryCode ?? null,
    asset_ids: null,
    asset_urls: null,
    scores: null,
    properties: context.message.log.request.properties ?? {},
    assets: [],
    target_url: context.message.log.request.targetUrl,
    model: context.processedLog.model ?? "",
    cache_reference_id: context.message.log.request.cacheReferenceId ?? null,
    cache_enabled: context.message.log.request.cacheEnabled ?? false,
    request_referrer: context.message.log.request.requestReferrer ?? null,
  };
};
