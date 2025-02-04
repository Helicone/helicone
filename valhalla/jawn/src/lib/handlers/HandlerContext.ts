import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { HeliconeRequest, Provider } from "../../packages/llm-mapper/types";
import { SetOnce } from "../../utils/setOnce";
import { AuthParams, OrgParams } from "../db/supabase";

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
  };
  response: {
    id: string;
    status: number;
    bodySize: number;
    timeToFirstToken?: number;
    responseCreatedAt: Date;
    delayMs: number;
  };
};

export type Usage = {
  promptTokens?: number;
  promptCacheWriteTokens?: number;
  promptCacheReadTokens?: number;
  completionTokens?: number;
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
  heliconeManualAccessKey?: string;
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
};

export type ExperimentCellValue = {
  columnId: string;
  rowIndex: number;
  value: string;
};

export const toHeliconeRequest = (context: HandlerContext): HeliconeRequest => {
  return {
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
    total_tokens: context.usage.totalTokens ?? null,
    prompt_tokens: context.usage.promptTokens ?? null,
    completion_tokens: context.usage.completionTokens ?? null,
    prompt_id: context.message.log.request.promptId ?? null,
    llmSchema: null,
    country_code: context.message.log.request.countryCode ?? null,
    asset_ids: null,
    asset_urls: null,
    scores: null,
    properties: context.message.log.request.properties ?? {},
    assets: [],
    target_url: context.message.log.request.targetUrl,
    model: context.processedLog.model ?? "",
  };
};
