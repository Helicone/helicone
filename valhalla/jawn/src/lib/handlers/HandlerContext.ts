import { Provider } from "../../models/models";
import { SetOnce } from "../../utils/setOnce";
import { ClickhouseDB } from "../db/ClickhouseWrapper";
import { Database } from "../db/database.types";
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

export interface TemplateWithInputs {
  template: object;
  inputs: { [key: string]: string };
}

export type Log = {
  request: {
    id: string;
    userId: string;
    promptId?: string;
    properties: Record<string, string>;
    heliconeApiKeyId?: number;
    heliconeProxyKeyId?: string;
    targetUrl: string;
    provider: Provider;
    bodySize: number;
    model: string;
    path: string;
    threat?: boolean;
    countryCode?: string;
    requestCreatedAt: Date;
    isStream: boolean;
    heliconeTemplate?: TemplateWithInputs;
  };
  response: {
    id: string;
    status: number;
    bodySize: number;
    model: string;
    timeToFirstToken?: number;
    responseCreatedAt: Date;
    delayMs: number;
  };
  assets?: Record<string, string>;
  model: string;
};

export type Usage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  heliconeCalculated?: boolean;
  cost?: number;
};

export type RawLog = {
  rawRequestBody?: any;
  rawResponseBody?: any;
};

export type ProcessedLog = {
  model?: string;
  request: {
    body?: any;
    heliconeTemplate?: TemplateWithInputs;
  };
  response: {
    body?: any;
  };
};

export type HeliconeMeta = {
  modelOverride?: string;
  omitRequestLog: boolean;
  omitResponseLog: boolean;
};

export type Message = {
  authorization: string;
  heliconeMeta: HeliconeMeta;
  log: Log;
};

export type PromptRecord = {
  promptId: string;
  orgId: string;
  requestId: string;
  model: string;
  heliconeTemplate: TemplateWithInputs;
  createdAt: Date;
};
