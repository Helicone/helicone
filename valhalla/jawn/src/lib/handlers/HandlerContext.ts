import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";
import { Provider } from "../../models/models";
import { SetOnce } from "../../utils/setOnce";
import { AuthParams, OrgParams } from "../db/supabase";

export class HandlerContext extends SetOnce {
  public message: Message;
  public authParams?: AuthParams;
  public orgParams?: OrgParams;
  public usage: Usage;
  public rawLog: RawLog;
  public processedLog: ProcessedLog;

  constructor(message: Message) {
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

export type Message = {
  authorization: string;
  heliconeMeta: HeliconeMeta;
  log: Log;
};

export type HeliconeScoresMessage = {
  requestId: string;
  organizationId: string;
  scores: {
    score_attribute_key: string;
    score_attribute_type: string;
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
