import { SupabaseClient } from "@supabase/supabase-js";
import { HeliconeProxyRequest } from "../HeliconeProxyRequest/mapper";
import { ClickhouseClientWrapper } from "../db/clickhouse";
import { ChatPrompt, Prompt } from "../promptFormater/prompt";
import { logInClickhouse } from "./clickhouseLog";
import { logRequest, readAndLogResponse } from "./logResponse";

export interface DBLoggableProps {
  response: {
    getResponseBody: () => Promise<string>;
    status: number;
    responseHeaders: Headers;
    omitLog: boolean;
  };
  request: {
    requestId: string;
    userId?: string;
    heliconeApiKeyAuthHash?: string;
    providerApiKeyAuthHash?: string;
    promptId?: string;
    promptFormatter?: {
      prompt: Prompt | ChatPrompt;
      name: string;
    };
    startTime: Date;
    bodyText?: string;
    path: string;
    properties: Record<string, string>;
    isStream: boolean;
    omitLog: boolean;
  };
}

export function dbLoggableRequestFromProxyRequest(
  proxyRequest: HeliconeProxyRequest
): DBLoggableProps["request"] {
  return {
    requestId: proxyRequest.requestId,
    heliconeApiKeyAuthHash: proxyRequest.heliconeAuthHash,
    providerApiKeyAuthHash: proxyRequest.providerAuthHash,
    promptId: proxyRequest.requestWrapper.heliconeHeaders.promptId ?? undefined,
    userId: proxyRequest.userId,
    promptFormatter:
      proxyRequest.formattedPrompt?.prompt && proxyRequest.formattedPrompt?.name
        ? {
            prompt: proxyRequest.formattedPrompt.prompt,
            name: proxyRequest.formattedPrompt.name,
          }
        : undefined,
    startTime: proxyRequest.startTime,
    bodyText: proxyRequest.bodyText ?? undefined,
    path: proxyRequest.requestWrapper.url.href,
    properties: proxyRequest.requestWrapper.heliconeProperties,
    isStream: proxyRequest.isStream,
    omitLog: proxyRequest.omitOptions.omitRequest,
  };
}

// Represents an object that can be logged to the database
export class DBLoggable {
  private response: DBLoggableProps["response"];
  private request: DBLoggableProps["request"];
  constructor(props: DBLoggableProps) {
    this.response = props.response;
    this.request = props.request;
  }

  async log(db: {
    supabase: SupabaseClient;
    clickhouse: ClickhouseClientWrapper;
  }) {
    const requestResult = await logRequest(this.request, db.supabase);

    if (requestResult.data !== null) {
      const responseResult = await readAndLogResponse(
        this.response,
        this.request,
        db.supabase
      );

      if (responseResult.data !== null) {
        await logInClickhouse(
          requestResult.data.request,
          responseResult.data,
          requestResult.data.properties,
          db.clickhouse
        );
      }
    }
  }
}
