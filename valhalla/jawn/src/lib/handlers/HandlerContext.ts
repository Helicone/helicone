import { Provider } from "../../models/models";
import { SetOnce } from "../../utils/setOnce";
import { Database } from "../db/database.types";
import { AuthParams, OrgParams } from "../db/supabase";

export class HandlerContext extends SetOnce {
  public message: Message;
  public authParams?: AuthParams;
  public orgParams?: OrgParams;
  public processedRequestBody?: string;
  public processedResponseBody?: string;
  public batchPayload: BatchPayload;

  constructor(message: Message) {
    super();
    this.message = message;
    this.batchPayload = {
      requests: [],
      responses: [],
      propoerties: [],
    };
  }

  addRequest(request: Database["public"]["Tables"]["request"]["Insert"]): void {
    this.batchPayload.requests.push(request);
  }

  addResponse(
    response: Database["public"]["Tables"]["response"]["Insert"]
  ): void {
    this.batchPayload.responses.push(response);
  }

  addProperties(
    property: Database["public"]["Tables"]["properties"]["Insert"][]
  ): void {
    this.batchPayload.propoerties.push(...property);
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

export type BatchPayload = {
  requests: Database["public"]["Tables"]["request"]["Insert"][];
  responses: Database["public"]["Tables"]["response"]["Insert"][];
  propoerties: Database["public"]["Tables"]["properties"]["Insert"][];
};
