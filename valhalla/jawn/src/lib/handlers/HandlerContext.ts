import { Provider } from "../../models/models";
import { SetOnce } from "../../utils/setOnce";
import { Database } from "../db/database.types";
import { AuthParams, OrgParams } from "../db/supabase";

export class HandlerContext extends SetOnce {
  public message: Message;
  public authParams?: AuthParams;
  public orgParams?: OrgParams;
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
    };
  }

  addProperties(
    property: Database["public"]["Tables"]["properties"]["Insert"][]
  ): void {
    this.payload.properties.push(...property);
  }
}

export type Log = {
  request: {
    id: string;
    userId: string;
    promptId: string;
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
    requestCreatedAt: string;
    isStream: boolean;
  };
  response: {
    id: string;
    body: string;
    status: number;
    model: string;
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
};
