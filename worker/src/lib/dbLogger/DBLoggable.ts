import { Headers } from "@cloudflare/workers-types";
import { SupabaseClient } from "@supabase/supabase-js";
import { Env, Provider } from "../..";
import { Database, Json } from "../../../supabase/database.types";
import { DBWrapper } from "../../db/DBWrapper";
import { withTimeout } from "../../helpers";
import { Result, err, ok } from "../../results";
import { HeliconeHeaders } from "../HeliconeHeaders";
import { HeliconeProxyRequest } from "../HeliconeProxyRequest/mapper";
import { RequestWrapper } from "../RequestWrapper";
import { INTERNAL_ERRORS } from "../constants";
import { ClickhouseClientWrapper } from "../db/clickhouse";
import { AsyncLogModel } from "../models/AsyncLog";
import { logInClickhouse } from "./clickhouseLog";
import { InsertQueue } from "./insertQueue";
import { logRequest } from "./logResponse";
import { anthropicAIStream } from "./parsers/anthropicStreamParser";
import { parseOpenAIStream } from "./parsers/openAIStreamParser";
import { getTokenCount } from "./tokenCounter";

export interface DBLoggableProps {
  response: {
    responseId: string;
    getResponseBody: () => Promise<{
      body: string;
      endTime: Date;
    }>;
    status: () => Promise<number>;
    responseHeaders: Headers;
    omitLog: boolean;
  };
  request: {
    requestId: string;
    userId?: string;
    heliconeProxyKeyId?: string;
    promptId?: string;
    startTime: Date;
    bodyText?: string;
    path: string;
    properties: Record<string, string>;
    isStream: boolean;
    omitLog: boolean;
    provider: Provider;
    nodeId: string | null;
    modelOverride?: string;
    heliconeTemplate?: Record<string, unknown>;
    threat: boolean | null;
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
    heliconeProxyKeyId: proxyRequest.heliconeProxyKeyId,
    promptId: proxyRequest.requestWrapper.heliconeHeaders.promptId ?? undefined,
    userId: proxyRequest.userId,
    startTime: proxyRequest.startTime,
    bodyText: proxyRequest.bodyText ?? undefined,
    path: proxyRequest.requestWrapper.url.href,
    properties: proxyRequest.requestWrapper.heliconeHeaders.heliconeProperties,
    isStream: proxyRequest.isStream,
    omitLog: proxyRequest.omitOptions.omitRequest,
    provider: proxyRequest.provider,
    nodeId: proxyRequest.nodeId,
    modelOverride:
      proxyRequest.requestWrapper.heliconeHeaders.modelOverride ?? undefined,
    heliconeTemplate: proxyRequest.heliconePromptTemplate ?? undefined,
    threat: proxyRequest.threat ?? undefined,
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

function getResponseBody(json: Record<string, Json>): {
  body: string;
  endTime: Date;
} {
  // This will mock the response as if it came from OpenAI
  if (json.streamed_data) {
    const streamedData = json.streamed_data as Json[];
    return {
      body: streamedData.map((d) => "data: " + JSON.stringify(d)).join("\n"),
      endTime: new Date(),
    };
  }
  return { body: JSON.stringify(json), endTime: new Date() };
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
      promptId: providerRequestHeaders.promptId ?? undefined,
      userId: providerRequestHeaders.userId ?? undefined,
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
      nodeId: requestWrapper.getNodeId(),
      modelOverride: requestWrapper.heliconeHeaders.modelOverride ?? undefined,
    },
    response: {
      responseId: crypto.randomUUID(),
      getResponseBody: async () =>
        getResponseBody(asyncLogModel.providerResponse.json),
      responseHeaders: providerResponseHeaders,
      status: async () => asyncLogModel.providerResponse.status,
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
    tokenCalcUrl: env.VALHALLA_URL,
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

  async waitForResponse(): Promise<{
    body: string;
    endTime: Date;
  }> {
    return await this.response.getResponseBody();
  }

  async tokenCounter(text: string): Promise<number> {
    return getTokenCount(text, this.provider, this.tokenCalcUrl);
  }

  async parseResponse(
    responseBody: string,
    status: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<Result<any, string>> {
    let result = responseBody;
    const isStream = this.request.isStream;
    const responseStatus = await this.response.status();
    const requestBody = this.request.bodyText;
    const tokenCounter = (t: string) => this.tokenCounter(t);
    if (isStream && status === INTERNAL_ERRORS["Cancelled"]) {
      // Remove last line of stream from result
      result = result.split("\n").slice(0, -1).join("\n");
    }

    const HTTPSErrorRange = responseStatus >= 400 && responseStatus < 600;
    const HTTPSRedirect = responseStatus >= 300 && responseStatus < 400;

    try {
      if (HTTPSErrorRange || HTTPSRedirect) {
        return ok(JSON.parse(result));
      } else if (!isStream && this.provider === "ANTHROPIC" && requestBody) {
        const responseJson = JSON.parse(result);
        const prompt = JSON.parse(requestBody)?.prompt ?? "";
        const completion = responseJson?.completion ?? "";
        const completionTokens = await tokenCounter(completion);
        const promptTokens = await tokenCounter(prompt);

        return ok({
          ...responseJson,
          usage: {
            total_tokens: promptTokens + completionTokens,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            helicone_calculated: true,
          },
        });
      } else if (!isStream && this.provider === "GOOGLE") {
        const responseJson = JSON.parse(result);
        const usageMetadataItem = responseJson.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: any) => item.usageMetadata
        );

        return ok({
          usage: {
            total_tokens: usageMetadataItem?.usageMetadata?.totalTokenCount,
            prompt_tokens: usageMetadataItem?.usageMetadata?.promptTokenCount,
            completion_tokens:
              usageMetadataItem?.usageMetadata?.candidatesTokenCount,
            helicone_calculated: false,
          },
        });
      } else if (isStream && this.provider === "ANTHROPIC") {
        return anthropicAIStream(result, tokenCounter, requestBody);
      } else if (isStream) {
        return parseOpenAIStream(result, tokenCounter, requestBody);
      } else {
        return ok(JSON.parse(result));
      }
    } catch (e) {
      console.log("Error parsing response", e);
      return {
        data: null,
        error: "error parsing response, " + e + ", " + result,
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tryJsonParse(text: string): any {
    try {
      return JSON.parse(text);
    } catch (e) {
      return {
        error: "error parsing response, " + e + ", " + text,
      };
    }
  }

  async getResponse() {
    const { body: responseBody, endTime: responseEndTime } =
      await this.response.getResponseBody();
    const endTime = this.timing.endTime ?? responseEndTime;
    const delay_ms = endTime.getTime() - this.timing.startTime.getTime();
    const status = await this.response.status();
    const parsedResponse = await this.parseResponse(responseBody, status);
    const isStream = this.request.isStream;

    if (
      !isStream &&
      this.provider === "GOOGLE" &&
      parsedResponse.error === null
    ) {
      const body = this.tryJsonParse(responseBody);
      const model = body?.model ?? body?.body?.model ?? undefined;

      return {
        id: this.response.responseId,
        created_at: endTime.toISOString(),
        request: this.request.requestId,
        body: this.response.omitLog
          ? {
              usage: parsedResponse.data?.usage,
              model,
            }
          : body,
        status: await this.response.status(),
        completion_tokens: parsedResponse.data.usage?.completion_tokens,
        prompt_tokens: parsedResponse.data.usage?.prompt_tokens,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: model,
        delay_ms,
      };
    }

    return parsedResponse.error === null
      ? {
          id: this.response.responseId,
          created_at: endTime.toISOString(),
          request: this.request.requestId,
          body: this.response.omitLog
            ? {
                usage: parsedResponse.data?.usage,
                model: parsedResponse.data?.model,
              }
            : parsedResponse.data,
          status: await this.response.status(),
          completion_tokens: parsedResponse.data.usage?.completion_tokens,
          prompt_tokens: parsedResponse.data.usage?.prompt_tokens,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model: (parsedResponse.data as any)?.model ?? undefined,
          delay_ms,
        }
      : {
          id: this.response.responseId,
          request: this.request.requestId,
          created_at: endTime.toISOString(),
          body: {
            helicone_error: "error parsing response",
            parse_response_error: parsedResponse.error,
            body: parsedResponse.data,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model: (parsedResponse.data as any)?.model ?? undefined,
          status: await this.response.status(),
        };
  }

  async readAndLogResponse(
    queue: InsertQueue
  ): Promise<
    Result<Database["public"]["Tables"]["response"]["Insert"], string>
  > {
    try {
      const response = await withTimeout(this.getResponse(), 1000 * 60 * 30); // 30 minutes
      const { error } = await queue.updateResponse(
        this.response.responseId,
        this.request.requestId,
        response
      );
      if (error !== null) {
        console.error("Error updating response", error);
        // return err(error);
      }
      return ok(response);
    } catch (e) {
      const { error } = await queue.updateResponse(
        this.response.responseId,
        this.request.requestId,
        {
          status: -1,
          body: {
            helicone_error: "error getting response, " + e,
            helicone_repsonse_body_as_string: (
              await this.response.getResponseBody()
            ).body,
          },
        }
      );
      if (error !== null) {
        return err(error);
      }
      return err("error getting response, " + e);
    }
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

  isSuccessResponse = (status: number | undefined | null): boolean =>
    status != null && status >= 200 && status <= 299;

  async log(db: {
    supabase: SupabaseClient<Database>; // TODO : Deprecate
    dbWrapper: DBWrapper;
    clickhouse: ClickhouseClientWrapper;
    queue: InsertQueue;
  }): Promise<Result<null, string>> {
    const { data: authParams, error } = await db.dbWrapper.getAuthParams();
    if (error || !authParams?.organizationId) {
      return err(`Auth failed! ${error}` ?? "Helicone organization not found");
    }

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
      requestResult.data.node,
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

    if (this.request.heliconeTemplate && this.request.promptId) {
      const upsertResult = await db.queue.upsertPrompt(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.request.heliconeTemplate as any,
        this.request.promptId ?? "",
        authParams.organizationId
      );

      if (upsertResult.error || !upsertResult.data) {
        console.error("Error upserting prompt", upsertResult.error);
        return err(JSON.stringify(upsertResult.error));
      }
      const propResult = await db.queue.putRequestProperty(
        requestResult.data.request.id,
        [
          {
            key: "Helicone-Prompt-Id",
            value: this.request.promptId,
          },
          {
            key: "Helicone-Prompt-Version",
            value: upsertResult.data.version.toString() ?? "",
          },
        ],
        authParams.organizationId
      );

      if (propResult.error || !propResult.data) {
        console.error("Error adding properties", propResult.error);
        return err(JSON.stringify(propResult.error));
      }
    }

    return ok(null);
  }
}
