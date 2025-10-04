import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { HeliconeRequest, Provider } from "@helicone-package/llm-mapper/types";
import { SetOnce } from "../../utils/setOnce";
import { AuthParams } from "../../packages/common/auth/types";
import { OrgParams } from "../../packages/common/auth/types";
import { DEFAULT_UUID } from "@helicone-package/llm-mapper/types";
import { ModelUsage } from "@helicone-package/cost";
import { CostBreakdown } from "@helicone-package/cost/models/calculate-cost";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { ResponseFormat } from "@helicone-package/cost/models/types";

export class HandlerContext extends SetOnce {
  public message: KafkaMessageContents;
  public authParams?: AuthParams;
  public orgParams?: OrgParams;
  public legacyUsage: Usage;
  public usage?: ModelUsage;
  public costBreakdown?: CostBreakdown;
  public rawLog: RawLog;
  public processedLog: ProcessedLog;
  public timingMetrics: { constructor: string; start: number }[] = [];

  constructor(message: KafkaMessageContents) {
    super();
    this.message = message;
    this.processedLog = {
      request: {},
      response: {},
    };
    this.legacyUsage = {};
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
    cost?: number;
  };
};

export type Usage = {
  promptTokens?: number;
  promptCacheWriteTokens?: number;
  promptCacheReadTokens?: number;
  promptAudioTokens?: number;
  completionTokens?: number;
  completionAudioTokens?: number;

  // anthropic cache control
  promptCacheWrite5m?: number;
  promptCacheWrite1h?: number;

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
  stripeCustomerId?: string;

  // Deprecated gateway metadata
  gatewayRouterId?: string;
  gatewayDeploymentTarget?: string;

  // AI Gateway metadata
  isPassthroughBilling?: boolean;
  gatewayProvider?: ModelProviderName;

  gatewayModel?: string; // registry format
  providerModelId?: string; // provider format
  gatewayResponseFormat?: ResponseFormat;
  gatewayEndpointVersion?: string; // endpoint config version
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
  const modelUsage = context.usage;
  const legacyUsage = context.legacyUsage;

  const promptTokens = getPromptTokens(modelUsage, legacyUsage);
  const completionTokens = getCompletionTokens(modelUsage, legacyUsage);
  const totalTokens = getTotalTokens(modelUsage, legacyUsage);
  const promptCacheWriteTokens = getPromptCacheWriteTokens(
    modelUsage,
    legacyUsage,
  );
  const promptCacheReadTokens = getPromptCacheReadTokens(
    modelUsage,
    legacyUsage,
  );
  const promptAudioTokens = getPromptAudioTokens(modelUsage, legacyUsage);
  const completionAudioTokens = legacyUsage.completionAudioTokens ?? null;

  return {
    cost: context.costBreakdown?.totalCost ?? legacyUsage.cost ?? null,
    request_body: context.processedLog.request.body,
    response_body: context.processedLog.response.body,
    request_id: context.message.log.request.id,
    response_id: context.message.log.response.id,
    request_created_at:
      context.message.log.request.requestCreatedAt.toISOString(),
    response_created_at:
      context.message.log.response.responseCreatedAt.toISOString(),
    response_status: context.message.log.response.status,
    request_model:
      context.message.heliconeMeta.gatewayModel ??
      context.processedLog.request.model ??
      null,
    response_model: null,
    request_path: context.message.log.request.path,
    request_user_id: context.message.log.request.userId ?? null,
    request_properties: context.message.log.request.properties ?? null,
    model_override: null,
    helicone_user: null,
    provider:
      context.message.heliconeMeta.gatewayProvider ??
      context.message.log.request.provider,
    delay_ms: context.message.log.response.delayMs ?? null,
    time_to_first_token: context.message.log.response.timeToFirstToken ?? null,

    // We don't track tokens on cache hits, since cost is 0
    total_tokens: isCacheHit ? 0 : totalTokens,
    prompt_tokens: isCacheHit ? 0 : promptTokens,
    completion_tokens: isCacheHit ? 0 : completionTokens,
    prompt_cache_write_tokens: isCacheHit ? 0 : promptCacheWriteTokens,
    prompt_cache_read_tokens: isCacheHit ? 0 : promptCacheReadTokens,
    prompt_audio_tokens: isCacheHit ? 0 : promptAudioTokens,
    completion_audio_tokens: isCacheHit ? 0 : completionAudioTokens,

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
    model:
      context.message.heliconeMeta.gatewayModel ??
      context.processedLog.model ??
      "",
    cache_reference_id: context.message.log.request.cacheReferenceId ?? null,
    cache_enabled: context.message.log.request.cacheEnabled ?? false,
    request_referrer: context.message.log.request.requestReferrer ?? null,
    gateway_endpoint_version:
      context.message.heliconeMeta.gatewayEndpointVersion ?? null,
  };
};

export function getPromptTokens(
  modelUsage: ModelUsage | undefined,
  legacyUsage: Usage,
): number | null {
  if (modelUsage?.input) {
    return modelUsage.input;
  }
  return legacyUsage.promptTokens ?? null;
}

export function getCompletionTokens(
  modelUsage: ModelUsage | undefined,
  legacyUsage: Usage,
): number | null {
  if (modelUsage?.output) {
    return modelUsage.output;
  }
  return legacyUsage.completionTokens ?? null;
}

function getTotalTokens(
  modelUsage: ModelUsage | undefined,
  legacyUsage: Usage,
): number | null {
  if (modelUsage?.input || modelUsage?.output) {
    return (modelUsage.input ?? 0) + (modelUsage.output ?? 0);
  }
  return legacyUsage.totalTokens ?? null;
}

export function getPromptCacheWriteTokens(
  modelUsage: ModelUsage | undefined,
  legacyUsage: Usage,
): number | null {
  const cacheDetails = modelUsage?.cacheDetails;
  if (cacheDetails) {
    const write5m = cacheDetails.write5m ?? 0;
    const write1h = cacheDetails.write1h ?? 0;
    return write5m + write1h;
  }
  return legacyUsage.promptCacheWriteTokens ?? null;
}

export function getPromptCacheReadTokens(
  modelUsage: ModelUsage | undefined,
  legacyUsage: Usage,
): number | null {
  const cacheDetails = modelUsage?.cacheDetails;
  if (cacheDetails?.cachedInput) {
    return cacheDetails.cachedInput;
  }
  return legacyUsage.promptCacheReadTokens ?? null;
}

export function getPromptAudioTokens(
  modelUsage: ModelUsage | undefined,
  legacyUsage: Usage,
): number | null {
  if (modelUsage?.audio) {
    return modelUsage.audio;
  }
  return legacyUsage.promptAudioTokens ?? null;
}
