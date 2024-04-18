import { Provider } from "../../models/models";
import { Database } from "../db/database.types";
import { AuthParams, OrgParams } from "../db/supabase";

export class HandlerContext {
  private _message: Message;
  private _authParams?: AuthParams;
  private _orgParams?: OrgParams;
  private _processedRequestBody?: string;
  private _processedResponseBody?: string;
  private _batchPayload: BatchPayload;

  constructor(message: Message) {
    this._message = message;
    this._batchPayload = {
      requests: [],
      responses: [],
      propoerties: [],
    };
  }

  get message(): Message {
    return this._message;
  }

  set message(value: Message) {
    this._message = value;
  }

  get processedRequestBody(): string | undefined {
    return this._processedRequestBody;
  }

  set processedRequestBody(value: string | undefined) {
    this._processedRequestBody = value;
  }

  get processedResponseBody(): string | undefined {
    return this._processedResponseBody;
  }

  set processedResponseBody(value: string | undefined) {
    this._processedResponseBody = value;
  }

  get authParams(): AuthParams | undefined {
    return this._authParams;
  }

  set authParams(value: AuthParams | undefined) {
    this._authParams = value;
  }

  // OrgParams getter and setter
  get orgParams(): OrgParams | undefined {
    return this._orgParams;
  }

  set orgParams(value: OrgParams | undefined) {
    this._orgParams = value;
  }
  addRequest(request: Database["public"]["Tables"]["request"]["Insert"]): void {
    this._batchPayload.requests.push(request);
  }

  addResponse(
    response: Database["public"]["Tables"]["response"]["Insert"]
  ): void {
    this._batchPayload.responses.push(response);
  }

  addProperties(
    property: Database["public"]["Tables"]["properties"]["Insert"][]
  ): void {
    this._batchPayload.propoerties.push(...property);
  }

  get batchPayload(): BatchPayload {
    return this._batchPayload;
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
