import { SupabaseClient } from "@supabase/supabase-js";
import { HeliconeProxyRequest } from "../HeliconeProxyRequest/mapper";
import { ClickhouseClientWrapper } from "../db/clickhouse";
import { ChatPrompt, Prompt } from "../promptFormater/prompt";
import { logInClickhouse } from "./clickhouseLog";
import { logRequest } from "./logResponse";
import { Env, Provider } from "../..";
import { getTokenCount } from "./tokenCounter";
import { Result, err, mapPostgrestErr } from "../../results";
import {
  consolidateTextFields,
  getUsage,
} from "./parsers/responseParserHelpers";
import { Database } from "../../../supabase/database.types";
import { HeliconeHeaders } from "../HeliconeHeaders";
import { RequestWrapper } from "../RequestWrapper";
import { AsyncLogModel } from "../models/AsyncLog";
import { InsertQueue } from "./insertQueue";
import { parseOpenAIStream } from "./parsers/openAIStreamParser";
import { anthropicAIStream } from "./parsers/anthropicStreamParser";
import { HeliconeAuth, DBWrapper as DBWrapper } from "../../db/DBWrapper";

export interface DBLoggableProps {
  response: {
    responseId: string;
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
    heliconeProxyKeyId?: string;
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
    provider: Provider;
    nodeId: string | null;
  };
  timing: {
    startTime: Date;
    endTime?: Date;
  };
  tokenCalcUrl: string;
}

export interface AuthParams {
  organizationId: string;
  userId?: string;
  heliconeApiKeyId?: number;
}

export function dbLoggableRequestFromProxyRequest(
  proxyRequest: HeliconeProxyRequest
): DBLoggableProps["request"] {
  return {
    requestId: proxyRequest.requestId,
    heliconeApiKeyAuthHash: proxyRequest.heliconeAuthHash,
    providerApiKeyAuthHash: proxyRequest.providerAuthHash,
    heliconeProxyKeyId: proxyRequest.heliconeProxyKeyId,
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
    properties: proxyRequest.requestWrapper.heliconeHeaders.heliconeProperties,
    isStream: proxyRequest.isStream,
    omitLog: proxyRequest.omitOptions.omitRequest,
    provider: proxyRequest.provider,
    nodeId: proxyRequest.nodeId,
  };
}

interface DBLoggableRequestFromAsyncLogModelProps {
  requestWrapper: RequestWrapper;
  env: Env;
  asyncLogModel: AsyncLogModel;
  providerRequestHeaders: HeliconeHeaders;
  providerResponseHeaders: Headers;
  provider: Provider;
}

function getResponseBody(json: any): string {
  // This will mock the response as if it came from OpenAI
  if (json.streamed_data) {
    const streamedData: any[] = json.streamed_data;
    return streamedData.map((d) => "data: " + JSON.stringify(d)).join("\n");
  }
  return JSON.stringify(json);
}

type UnPromise<T> = T extends Promise<infer U> ? U : T;

export async function dbLoggableRequestFromAsyncLogModel(
  props: DBLoggableRequestFromAsyncLogModelProps
): Promise<DBLoggable> {
  const {
    requestWrapper,
    env,
    asyncLogModel,
    providerRequestHeaders,
    providerResponseHeaders,
    provider,
  } = props;
  return new DBLoggable({
    request: {
      requestId: providerRequestHeaders.requestId ?? crypto.randomUUID(),
      heliconeApiKeyAuthHash: await requestWrapper.getProviderAuthHeader(),
      providerApiKeyAuthHash: "N/A",
      promptId: providerRequestHeaders.promptId ?? undefined,
      userId: providerRequestHeaders.userId ?? undefined,
      promptFormatter: undefined,
      startTime: new Date(
        asyncLogModel.timing.startTime.seconds * 1000 +
          asyncLogModel.timing.startTime.milliseconds
      ),
      bodyText: JSON.stringify(asyncLogModel.providerRequest.json),
      path: asyncLogModel.providerRequest.url,
      properties: providerRequestHeaders.heliconeProperties,
      isStream: asyncLogModel.providerRequest.json?.stream == true ?? false,
      omitLog: false,
      provider,
      nodeId: requestWrapper.getTaskId(),
    },
    response: {
      responseId: crypto.randomUUID(),
      getResponseBody: async () =>
        getResponseBody(asyncLogModel.providerResponse.json),
      responseHeaders: providerResponseHeaders,
      status: asyncLogModel.providerResponse.status,
      omitLog: false,
    },
    timing: {
      startTime: new Date(
        asyncLogModel.timing.startTime.seconds * 1000 +
          asyncLogModel.timing.startTime.milliseconds
      ),
      endTime: new Date(
        asyncLogModel.timing.endTime.seconds * 1000 +
          asyncLogModel.timing.endTime.milliseconds
      ),
    },
    tokenCalcUrl: env.TOKEN_COUNT_URL,
  });
}

// Represents an object that can be logged to the database
export class DBLoggable {
  private response: DBLoggableProps["response"];
  private request: DBLoggableProps["request"];
  private timing: DBLoggableProps["timing"];
  private provider: Provider;
  private tokenCalcUrl: string;

  constructor(props: DBLoggableProps) {
    this.response = props.response;
    this.request = props.request;
    this.timing = props.timing;
    this.provider = props.request.provider;
    this.tokenCalcUrl = props.tokenCalcUrl;
  }

  async waitForResponse(): Promise<string> {
    return await this.response.getResponseBody();
  }

  async tokenCounter(text: string): Promise<number> {
    return getTokenCount(text, this.provider, this.tokenCalcUrl);
  }

  async parseResponse(responseBody: string): Promise<Result<any, string>> {
    const result = responseBody;
    const isStream = this.request.isStream;
    const responseStatus = this.response.status;
    const requestBody = this.request.bodyText;
    const tokenCounter = (t: string) => this.tokenCounter(t);

    try {
      if (!isStream && this.provider === "ANTHROPIC" && requestBody) {
        const responseJson = JSON.parse(result);
        const prompt = JSON.parse(requestBody)?.prompt ?? "";
        const completion = responseJson?.completion ?? "";
        const completionTokens = await tokenCounter(completion);
        const promptTokens = await tokenCounter(prompt);

        return {
          data: {
            ...responseJson,
            usage: {
              total_tokens: promptTokens + completionTokens,
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              helicone_calculated: true,
            },
          },
          error: null,
        };
      } else if (!isStream || responseStatus !== 200) {
        return {
          data: JSON.parse(result),
          error: null,
        };
      } else if (isStream && this.provider === "ANTHROPIC") {
        return anthropicAIStream(result, tokenCounter, requestBody);
      } else if (isStream) {
        return parseOpenAIStream(result, tokenCounter, requestBody);
      } else {
        return {
          data: null,
          error: "Unknown error parsing response",
        };
      }
    } catch (e) {
      console.log("Error parsing response", e);
      return {
        data: null,
        error: "error parsing response, " + e + ", " + result,
      };
    }
  }

  tryJsonParse(text: string): any {
    try {
      return JSON.parse(text);
    } catch (e) {
      return {
        error: "error parsing response, " + e + ", " + text,
      };
    }
  }

  async readAndLogResponse(
    queue: InsertQueue
  ): Promise<
    Result<Database["public"]["Tables"]["response"]["Insert"], string>
  > {
    const responseBody = await this.response.getResponseBody();

    const endTime = this.timing.endTime ?? new Date();
    const delay_ms = endTime.getTime() - this.timing.startTime.getTime();

    const parsedResponse = await this.parseResponse(responseBody);

    const response =
      parsedResponse.error === null
        ? {
            id: this.response.responseId,
            created_at: endTime.toISOString(),
            request: this.request.requestId,
            body: this.response.omitLog
              ? {
                  usage: parsedResponse.data?.usage,
                }
              : parsedResponse.data,
            status: this.response.status,
            completion_tokens: parsedResponse.data.usage?.completion_tokens,
            prompt_tokens: parsedResponse.data.usage?.prompt_tokens,
            delay_ms,
          }
        : {
            id: this.response.responseId,
            request: this.request.requestId,
            created_at: endTime.toISOString(),
            body: {
              helicone_error: "error parsing response",
              parse_response_error: parsedResponse.error,
              body: this.tryJsonParse(responseBody),
            },
            status: this.response.status,
          };

    const { error } = await queue.updateResponse(
      this.response.responseId,
      this.request.requestId,
      response
    );
    if (error !== null) {
      return {
        data: null,
        error: error,
      };
    }
    return {
      data: response,
      error: null,
    };
  }

  async sendToWebhook(
    dbClient: SupabaseClient<Database>,
    payload: {
      request: UnPromise<ReturnType<typeof logRequest>>["data"];
      response: Database["public"]["Tables"]["response"]["Insert"];
    },
    webhook: Database["public"]["Tables"]["webhooks"]["Row"]
  ): Promise<Result<undefined, string>> {
    // Check FF
    const checkWebhookFF = await dbClient
      .from("feature_flags")
      .select("*")
      .eq("feature", "webhook_beta")
      .eq("org_id", payload.request?.request.helicone_org_id ?? "");
    if (checkWebhookFF.error !== null || checkWebhookFF.data.length === 0) {
      console.error(
        "Error checking webhook ff or webhooks not enabled for user trying to use them",
        checkWebhookFF.error
      );
      return {
        data: undefined,
        error: null,
      };
    }

    const subscriptions =
      (
        await dbClient
          .from("webhook_subscriptions")
          .select("*")
          .eq("webhook_id", webhook.id)
      ).data ?? [];

    const shouldSend =
      subscriptions
        .map((subscription) => {
          return subscription.event === "beta";
        })
        .filter((x) => x).length > 0;

    if (shouldSend) {
      console.log("SENDING", webhook.destination, payload.request?.request.id);
      await fetch(webhook.destination, {
        method: "POST",
        body: JSON.stringify({
          request_id: payload.request?.request.id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
    return {
      data: undefined,
      error: null,
    };
  }

  async sendToWebhooks(
    dbClient: SupabaseClient<Database>,
    payload: {
      request: UnPromise<ReturnType<typeof logRequest>>["data"];
      response: Database["public"]["Tables"]["response"]["Insert"];
    }
  ): Promise<Result<undefined, string>> {
    if (!payload.request?.request.helicone_org_id) {
      return {
        data: null,
        error: "Org id undefined",
      };
    }

    const webhooks = await dbClient
      .from("webhooks")
      .select("*")
      .eq("org_id", payload.request?.request.helicone_org_id ?? "")
      .eq("is_verified", true);
    if (webhooks.error !== null) {
      return {
        data: null,
        error: webhooks.error.message,
      };
    }
    for (const webhook of webhooks.data ?? []) {
      const res = await this.sendToWebhook(dbClient, payload, webhook);
      if (res.error !== null) {
        return res;
      }
    }

    return {
      data: undefined,
      error: null,
    };
  }

  auth(): HeliconeAuth {
    return this.request.heliconeProxyKeyId
      ? {
          heliconeProxyKeyId: this.request.heliconeProxyKeyId,
          heliconeApiKeyAuthHash: undefined,
        }
      : {
          heliconeApiKeyAuthHash: this.request.heliconeApiKeyAuthHash ?? "",
          heliconeProxyKeyId: undefined,
        };
  }

  async log(
    db: {
      supabase: SupabaseClient<Database>; // TODO : Deprecate
      dbWrapper: DBWrapper;
      clickhouse: ClickhouseClientWrapper;
      queue: InsertQueue;
    },
    rateLimitKV: KVNamespace
  ): Promise<Result<null, string>> {
    const { data: authParams, error } = await db.dbWrapper.getAuthParams();
    if (error || !authParams?.organizationId) {
      return { data: null, error: error ?? "Helicone organization not found" };
    }

    console.log("Logging request", this.request.requestId);
    const rateLimiter = await db.dbWrapper.getRateLimiter();
    if (rateLimiter.error !== null) {
      return rateLimiter;
    }
    const tier = await db.dbWrapper.getTier();

    if (tier.error !== null) {
      return err(tier.error);
    }

    const rateLimit = await rateLimiter.data.checkRateLimit(tier.data);

    if (rateLimit.shouldLogInDB) {
      console.log("LOGGING RATE LIMIT IN DB");
      await db.dbWrapper.recordRateLimitHit(
        authParams.organizationId,
        rateLimit.rlIncrementDB
      );
    }

    if (rateLimit.isRateLimited) {
      console.log("RATE LIMITED");
      return err("Rate limited");
    }

    const requestResult = await logRequest(
      this.request,
      this.response.responseId,
      db.supabase,
      db.queue,
      authParams
    );
    console.log("Logged request", requestResult);

    // If no data or error, return
    if (!requestResult.data || requestResult.error) {
      return requestResult;
    }

    const responseResult = await this.readAndLogResponse(db.queue);

    // If no data or error, return
    if (!responseResult.data || responseResult.error) {
      return responseResult;
    }

    await logInClickhouse(
      requestResult.data.request,
      responseResult.data,
      requestResult.data.properties,
      db.clickhouse
    );

    // TODO We should probably move the webhook stuff out of dbLogger
    const { error: webhookError } = await this.sendToWebhooks(db.supabase, {
      request: requestResult.data,
      response: responseResult.data,
    });

    if (webhookError !== null) {
      console.error("Error sending to webhooks", webhookError);
      return {
        data: null,
        error: webhookError,
      };
    }

    return {
      data: null,
      error: null,
    };
  }
}
