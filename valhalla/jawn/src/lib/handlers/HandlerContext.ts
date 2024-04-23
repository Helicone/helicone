import { Provider } from "../../models/models";
import { SetOnce } from "../../utils/setOnce";
import { Database } from "../db/database.types";
import { AuthParams, OrgParams } from "../db/supabase";
import { Usage } from "../shared/bodyProcessors/IBodyProcessor";
import { ClickhouseDB } from "../shared/db/dbExecute";

export class HandlerContext extends SetOnce {
  public message: Message;
  public authParams?: AuthParams;
  public orgParams?: OrgParams;
  public usage: Usage;
  public processedLog: ProcessedLog;
  public payload: Payload;

  constructor(message: Message) {
    super();
    this.message = message;
    this.processedLog = {
      request: {},
      response: {},
    };
    this.payload = {
      properties: [],
      prompts: [],
      promptVersions: [],
      promptInputKeys: [],
      promptInputRecords: [],
      propertiesV3CH: [],
      propertyWithResponseV1CH: [],
    };
    this.usage = {};
  }

  addProperties(
    properties: Database["public"]["Tables"]["properties"]["Insert"][]
  ): void {
    this.payload.properties.push(...properties);
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
    heliconeApiKeyId: string;
    heliconeProxyKeyId?: string;
    targetUrl: string;
    provider: Provider;
    model: string;
    path: string;
    body: string;
    threat?: boolean;
    countryCode?: string;
    requestCreatedAt: Date;
    isStream: boolean;
    assets: Record<string, string>;
    heliconeTemplate: TemplateWithInputs;
  };
  response: {
    id: string;
    body: string;
    status: number;
    model: string;
    timeToFirstToken: number;
    responseCreatedAt: Date;
    delayMs: number;
    assets: Record<string, string>;
  };
  model: string;
};

export type ProcessedLog = {
  model?: string;
  request: {
    body?: any;
  };
  response: {
    body?: any;
  };
};

export type HeliconeMeta = {
  modelOverride: string;
  omitRequestLog: boolean;
  omitResponseLog: boolean;
};

export type Message = {
  authorization: string;
  heliconeMeta: HeliconeMeta;
  log: Log;
};

export type Payload = {
  request?: Database["public"]["Tables"]["request"]["Insert"];
  response?: Database["public"]["Tables"]["response"]["Insert"];
  properties: Database["public"]["Tables"]["properties"]["Insert"][];
  prompts: Database["public"]["Tables"]["prompt_v2"]["Insert"][];
  promptVersions: Database["public"]["Tables"]["prompts_versions"]["Insert"][];
  promptInputKeys: Database["public"]["Tables"]["prompt_input_keys"]["Insert"][];
  promptInputRecords: Database["public"]["Tables"]["prompt_input_record"]["Insert"][];
  requestResponseLogCH?: ClickhouseDB["Tables"]["request_response_log"];
  propertiesV3CH: ClickhouseDB["Tables"]["properties_v3"][];
  propertyWithResponseV1CH: ClickhouseDB["Tables"]["property_with_response_v1"][];
};
