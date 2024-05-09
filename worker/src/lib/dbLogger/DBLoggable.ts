import { Headers } from "@cloudflare/workers-types";
import { SupabaseClient } from "@supabase/supabase-js";
import { Env, Provider } from "../..";
import { Database, Json } from "../../../supabase/database.types";
import { DBWrapper } from "../db/DBWrapper";
import { withTimeout } from "../util/helpers";
import { Result, err, ok } from "../util/results";
import { HeliconeHeaders } from "../models/HeliconeHeaders";
import { HeliconeProxyRequest } from "../models/HeliconeProxyRequest";
import { RequestWrapper } from "../RequestWrapper";
import { INTERNAL_ERRORS } from "../util/constants";
import { AsyncLogModel } from "../models/AsyncLog";
import { logInClickhouse } from "../db/ClickhouseStore";
import { RequestResponseStore } from "../db/RequestResponseStore";
import {
  anthropicAIStream,
  getModel,
} from "./streamParsers/anthropicStreamParser";
import { parseOpenAIStream } from "./streamParsers/openAIStreamParser";
import { getTokenCount } from "../clients/TokenCounterClient";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { RequestResponseManager } from "../managers/RequestResponseManager";
import {
  isRequestImageModel,
  isResponseImageModel,
} from "../util/imageModelMapper";
import {
  getRequestImageModelParser,
  getResponseImageModelParser,
} from "./imageParsers/parserMapper";
import { TemplateWithInputs } from "../../api/lib/promptHelpers";
import { ImageModelParsingResponse } from "./imageParsers/core/parsingResponse";
import {
  HeliconeRequestResponseToPosthog,
  PosthogClient,
} from "../clients/PosthogClient";
import { costOfPrompt } from "../../packages/cost";
import { KafkaMessage, KafkaProducer } from "../clients/KafkaProducer";

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
    targetUrl: string;
    properties: Record<string, string>;
    isStream: boolean;
    omitLog: boolean;
    provider: Provider;
    nodeId: string | null;
    modelOverride?: string;
    heliconeTemplate?: TemplateWithInputs;
    threat: boolean | null;
    flaggedForModeration: boolean | null;
    request_ip: string | null;
    country_code: string | null;
  };
  timing: {
    startTime: Date;
    endTime?: Date;
    timeToFirstToken: () => Promise<number | null>;
  };
  tokenCalcUrl: string;
}

export interface AuthParams {
  organizationId: string;
  userId?: string;
  heliconeApiKeyId?: number;
}

export function dbLoggableRequestFromProxyRequest(
  proxyRequest: HeliconeProxyRequest,
  requestStartTime: Date
): DBLoggableProps["request"] {
  return {
    requestId: proxyRequest.requestId,
    heliconeProxyKeyId: proxyRequest.heliconeProxyKeyId,
    promptId: proxyRequest.requestWrapper.heliconeHeaders.promptId ?? undefined,
    userId: proxyRequest.userId,
    startTime: requestStartTime,
    bodyText: proxyRequest.bodyText ?? undefined,
    path: proxyRequest.requestWrapper.url.href,
    targetUrl: proxyRequest.targetUrl.href,
    properties: proxyRequest.requestWrapper.heliconeHeaders.heliconeProperties,
    isStream: proxyRequest.isStream,
    omitLog: proxyRequest.omitOptions.omitRequest,
    provider: proxyRequest.provider,
    nodeId: proxyRequest.nodeId,
    modelOverride:
      proxyRequest.requestWrapper.heliconeHeaders.modelOverride ?? undefined,
    heliconeTemplate: proxyRequest.heliconePromptTemplate ?? undefined,
    threat: proxyRequest.threat ?? null,
    flaggedForModeration: proxyRequest.flaggedForModeration ?? null,
    request_ip: null,
    country_code: (proxyRequest.requestWrapper.cf?.country as string) ?? null,
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
      targetUrl: asyncLogModel.providerRequest.url,
      properties: providerRequestHeaders.heliconeProperties,
      isStream: asyncLogModel.providerRequest.json?.stream == true ?? false,
      omitLog: false,
      provider,
      nodeId: requestWrapper.getNodeId(),
      modelOverride: requestWrapper.heliconeHeaders.modelOverride ?? undefined,
      threat: null,
      flaggedForModeration: null,
      request_ip: null,
      country_code: (requestWrapper.cf?.country as string) ?? null,
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
      timeToFirstToken: async () => null,
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
        if (getModel(requestBody ?? "{}").includes("claude-3")) {
          if (
            !responseJson?.usage?.output_tokens ||
            !responseJson?.usage?.input_tokens
          ) {
            return ok(responseJson);
          } else {
            return ok({
              ...responseJson,
              usage: {
                total_tokens:
                  responseJson?.usage?.output_tokens +
                  responseJson?.usage?.input_tokens,
                prompt_tokens: responseJson?.usage?.input_tokens,
                completion_tokens: responseJson?.usage?.output_tokens,
                helicone_calculated: true,
              },
            });
          }
        } else {
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
        }
      } else if (!isStream && this.provider === "GOOGLE") {
        const responseJson = JSON.parse(result);
        let usageMetadataItem;
        if (Array.isArray(responseJson)) {
          usageMetadataItem = responseJson.find((item) => item.usageMetadata);
        } else {
          usageMetadataItem = responseJson.usageMetadata
            ? responseJson
            : undefined;
        }

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
      console.log("Error parsing response 1", e);
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

  getUsage(parsedResponse: unknown): {
    prompt_tokens: number | undefined;
    completion_tokens: number | undefined;
  } {
    if (
      typeof parsedResponse !== "object" ||
      parsedResponse === null ||
      !("usage" in parsedResponse)
    ) {
      return {
        prompt_tokens: undefined,
        completion_tokens: undefined,
      };
    }

    const response = parsedResponse as {
      usage: {
        prompt_tokens?: number;
        completion_tokens?: number;
        input_tokens?: number;
        output_tokens?: number;
      };
    };
    const usage = response.usage;

    return {
      prompt_tokens: usage?.prompt_tokens ?? usage?.input_tokens,
      completion_tokens: usage?.completion_tokens ?? usage?.output_tokens,
    };
  }

  async getResponse() {
    const { body: responseBody, endTime: responseEndTime } =
      await this.response.getResponseBody();
    const endTime = this.timing.endTime ?? responseEndTime;
    const delay_ms = endTime.getTime() - this.timing.startTime.getTime();
    const timeToFirstToken = this.request.isStream
      ? await this.timing.timeToFirstToken()
      : null;
    const status = await this.response.status();
    const parsedResponse = await this.parseResponse(responseBody, status);
    const isStream = this.request.isStream;

    const usage = this.getUsage(parsedResponse.data);

    if (
      !isStream &&
      this.provider === "GOOGLE" &&
      parsedResponse.error === null
    ) {
      const body = this.tryJsonParse(responseBody);
      const model = body?.model ?? body?.body?.model ?? undefined;

      return {
        response: {
          id: this.response.responseId,
          created_at: endTime.toISOString(),
          request: this.request.requestId,
          body: this.response.omitLog // TODO: Remove in favor of S3 storage
            ? {
                usage: parsedResponse.data?.usage,
                model,
              }
            : body,
          status: await this.response.status(),
          completion_tokens: usage.completion_tokens,
          prompt_tokens: usage.prompt_tokens,
          time_to_first_token: timeToFirstToken,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model: model,
          delay_ms,
        },
        body: this.response.omitLog
          ? {
              usage: parsedResponse.data?.usage,
              model,
            }
          : body,
      };
    }

    return parsedResponse.error === null
      ? {
          response: {
            id: this.response.responseId,
            created_at: endTime.toISOString(),
            request: this.request.requestId,
            body: this.response.omitLog // TODO: Remove in favor of S3 storage
              ? {
                  usage: parsedResponse.data?.usage,
                  model: parsedResponse.data?.model,
                }
              : parsedResponse.data,
            status: await this.response.status(),
            completion_tokens: usage.completion_tokens,
            prompt_tokens: usage.prompt_tokens,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            model: (parsedResponse.data as any)?.model ?? undefined,
            delay_ms,
            time_to_first_token: timeToFirstToken,
          },
          body: this.response.omitLog
            ? {
                usage: parsedResponse.data?.usage,
                model: parsedResponse.data?.model,
              }
            : parsedResponse.data,
        }
      : {
          response: {
            id: this.response.responseId,
            request: this.request.requestId,
            created_at: endTime.toISOString(),
            body: {
              // TODO: Remove in favor of S3 storage
              helicone_error: "error parsing response",
              parse_response_error: parsedResponse.error,
              body: parsedResponse.data,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            model: (parsedResponse.data as any)?.model ?? undefined,
            status: await this.response.status(),
          },
          body: {
            helicone_error: "error parsing response",
            parse_response_error: parsedResponse.error,
            body: parsedResponse.data,
          },
        };
  }

  async readAndLogResponse(
    queue: RequestResponseStore,
    model: string | null
  ): Promise<
    Result<
      {
        response: Database["public"]["Tables"]["response"]["Insert"];
        body: string;
        responseAssets: Map<string, string>;
      },
      string
    >
  > {
    try {
      const { response, body } = await withTimeout(
        this.getResponse(),
        1000 * 60 * 30
      ); // 30 minutes
      let imageModelParsingResponse: ImageModelParsingResponse = {
        body,
        assets: new Map<string, string>(),
      };
      if (model && isResponseImageModel(model)) {
        const imageModelParser = getResponseImageModelParser(model);
        if (imageModelParser) {
          imageModelParsingResponse =
            imageModelParser.processResponseBody(body);
        }
      }
      response.body = imageModelParsingResponse.body;
      const { error } = await queue.updateResponse(
        this.response.responseId,
        this.request.requestId,
        response
      );
      if (error !== null) {
        console.error("Error updating response", error);
        // return err(error);
      }
      return ok({
        response,
        body: imageModelParsingResponse.body,
        responseAssets: imageModelParsingResponse.assets,
      });
    } catch (e) {
      const { error } = await queue.updateResponse(
        this.response.responseId,
        this.request.requestId,
        {
          status: -1,
          body: "",
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
      webhook.destination.includes("helicone-scoring-webhook") ||
      subscriptions
        .map((subscription) => {
          return subscription.event === "beta";
        })
        .filter((x) => x).length > 0;

    if (shouldSend) {
      console.log("SENDING", webhook.destination, payload.request?.request.id);
      try {
        await fetch(webhook.destination, {
          method: "POST",
          body: JSON.stringify({
            request_id: payload.request?.request.id,
            request_body: payload.request?.request.body,
            response_body: payload.response.body,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        console.error("Error sending to webhook", error.message);
      }
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

  async log(
    db: {
      supabase: SupabaseClient<Database>; // TODO : Deprecate
      dbWrapper: DBWrapper;
      clickhouse: ClickhouseClientWrapper;
      queue: RequestResponseStore;
      requestResponseManager: RequestResponseManager;
      kafkaProducer: KafkaProducer;
    },
    S3_ENABLED: Env["S3_ENABLED"],
    ORG_IDS: string,
    PERCENT_LOG: string,
    requestHeaders?: HeliconeHeaders
  ): Promise<
    Result<
      {
        cost: number;
      } | null,
      string
    >
  > {
    const { data: authParams, error } = await db.dbWrapper.getAuthParams();
    if (error || !authParams?.organizationId) {
      return err(`Auth failed! ${error}` ?? "Helicone organization not found");
    }

    let orgIds: string[] = [];
    try {
      if (ORG_IDS) {
        orgIds = ORG_IDS.split(",").filter((id) => id.length > 0);
      }
    } catch (e) {
      console.error("Error parsing orgIds", e);
    }

    let percentLogKafka = 0;
    if (PERCENT_LOG) {
      try {
        percentLogKafka = parseFloat(PERCENT_LOG);
      } catch (e) {
        console.error("Error parsing percentLogKafka", e);
      }
    }
    // Kafka processing
    if (
      // authParams.organizationId === "83635a30-5ba6-41a8-8cc6-fb7df941b24a" ||
      orgIds.includes(authParams.organizationId) ||
      authParams.organizationId === "01699b51-e07b-4d49-8cda-0c7557f5b6b1" ||
      authParams.organizationId === "dad350b5-4afe-4fd5-b910-ba74c0ad2f0f" ||
      Math.random() < percentLogKafka
    ) {
      await this.useKafka(db, authParams, S3_ENABLED, requestHeaders);

      return ok(null);
    }

    const rateLimiter = await db.dbWrapper.getRateLimiter();
    if (rateLimiter.error !== null) {
      return rateLimiter;
    }

    const org = await db.dbWrapper.getOrganization();

    if (org.error !== null) {
      return err(org.error);
    }
    const tier = org.data?.tier;

    if (org.data.percentLog !== 100_000) {
      const random = Math.random() * 100_000;
      console.log(
        `NOT LOGGING FOR ORG ID: ${authParams.organizationId} ${random} ${org.data.percentLog}`
      );
      if (random > org.data.percentLog) {
        return ok(null);
      }
    }

    const rateLimit = await rateLimiter.data.checkRateLimit(tier);

    if (rateLimit.error) {
      console.error(`Error checking rate limit: ${rateLimit.error}`);
    }

    if (!rateLimit.error && rateLimit.data?.isRateLimited) {
      await db.clickhouse.dbInsertClickhouse("rate_limit_log", [
        {
          organization_id: authParams.organizationId,
        },
      ]);
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
    const responseResult = await this.readAndLogResponse(
      db.queue,
      requestResult.data.request.model
    );
    const model =
      requestResult?.data?.request?.model_override ??
      responseResult?.data?.response?.model ??
      requestResult?.data?.request?.model ??
      "not-found";

    let assets: Map<string, string> = new Map();

    if (requestResult?.data?.requestAssets) {
      assets = new Map([...assets, ...requestResult.data.requestAssets]);
    }

    if (responseResult?.data?.responseAssets) {
      assets = new Map([...assets, ...responseResult.data.responseAssets]);
    }

    let s3Result: Result<string, string>;
    // If no data or error, return
    if (!responseResult.data || responseResult.error) {
      // Log the error in S3
      if (S3_ENABLED === "true") {
        s3Result = await db.requestResponseManager.storeRequestResponseData({
          organizationId: authParams.organizationId,
          requestId: this.request.requestId,
          requestBody: requestResult.data.body,
          responseBody: JSON.stringify({
            helicone_error: "error getting response, " + responseResult.error,
            helicone_repsonse_body_as_string: (
              await this.response.getResponseBody()
            ).body,
          }),
          model: model,
          assets: assets,
        });
      }

      return responseResult;
    }

    if (S3_ENABLED === "true") {
      s3Result = await db.requestResponseManager.storeRequestResponseData({
        organizationId: authParams.organizationId,
        requestId: this.request.requestId,
        requestBody: requestResult.data.body,
        responseBody: responseResult.data.body,
        model: model,
        assets: assets,
      });

      if (s3Result.error) {
        console.error("Error storing request response", s3Result.error);
        // Continue logging to clickhouse
      }
    }

    await logInClickhouse(
      requestResult.data.request,
      responseResult.data.response,
      requestResult.data.properties,
      requestResult.data.node,
      db.clickhouse
    );

    // TODO We should probably move the webhook stuff out of dbLogger
    const { error: webhookError } = await this.sendToWebhooks(db.supabase, {
      request: requestResult.data,
      response: responseResult.data.response,
    });

    if (webhookError !== null) {
      console.error("Error sending to webhooks", webhookError);
      return {
        data: null,
        error: webhookError,
      };
    }

    if (this.request.heliconeTemplate && this.request.promptId) {
      const assets = requestResult.data.requestAssets;

      const inverseAssets: Map<string, string> = new Map();
      assets.forEach((value, key) => inverseAssets.set(value, key));

      const inputs = Object.entries(
        this.request.heliconeTemplate.inputs
      ).reduce<{ [key: string]: string }>((acc, [key, value]) => {
        const assetId = inverseAssets.get(value);
        acc[key] = assetId ? `<helicone-asset-id key="${assetId}"/>` : value;
        return acc;
      }, {});

      const newTemplateWithInputs: TemplateWithInputs = {
        template: this.request.heliconeTemplate.template,
        inputs: inputs,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const upsertResult2 = await db.queue.promptStore.upsertPromptV2(
        newTemplateWithInputs,
        this.request.promptId,
        authParams.organizationId,
        this.request.requestId
      );

      const upsertResult = await db.queue.upsertPrompt(
        newTemplateWithInputs,
        this.request.promptId ?? "",
        authParams.organizationId
      );

      if (upsertResult.error || !upsertResult.data) {
        console.error("Error upserting prompt", upsertResult.error);
        return err(JSON.stringify(upsertResult.error));
      }
    }

    const cost =
      this.modelCost({
        model: model ?? null,
        sum_completion_tokens:
          responseResult.data.response.completion_tokens ?? 0,
        sum_prompt_tokens: responseResult.data.response.completion_tokens ?? 0,
        sum_tokens:
          (responseResult.data.response.completion_tokens ?? 0) +
          (responseResult.data.response.prompt_tokens ?? 0),
        provider: requestResult.data.request.provider ?? "",
      }) ?? 0;

    if (requestHeaders?.posthogKey) {
      const posthogClient = new PosthogClient(
        requestHeaders.posthogKey,
        requestHeaders.posthogHost
      );
      const reqBody = JSON.parse(this.request.bodyText ?? "{}") ?? null;
      const heliconeRequestResponse: HeliconeRequestResponseToPosthog = {
        model: model ?? "",
        temperature: reqBody.temperature ?? 0.0,
        n: reqBody.n ?? 0,
        promptId: requestResult.data.request.prompt_id ?? "",
        timeToFirstToken: responseResult.data.response.time_to_first_token ?? 0,
        cost: cost,
        provider: requestResult.data.request.provider ?? "",
        path: requestResult.data.request.path ?? "",
        completetionTokens: responseResult.data.response.completion_tokens ?? 0,
        promptTokens: responseResult.data.response.prompt_tokens ?? 0,
        totalTokens:
          (responseResult.data.response.completion_tokens ?? 0) +
          (responseResult.data.response.prompt_tokens ?? 0),
        userId: requestResult.data.request.user_id ?? "",
        countryCode: requestResult.data.request.country_code ?? "",
        requestBodySize:
          requestResult.data.request.body?.toString().length ?? 0,
        responseBodySize:
          responseResult.data.response.body?.toString().length ?? 0,
        delayMs: responseResult.data.response.delay_ms ?? 0,
      };

      await posthogClient.captureEvent(
        "helicone_request_response",
        heliconeRequestResponse
      );
    }

    return ok({
      cost,
    });
  }

  async useKafka(
    db: {
      supabase: SupabaseClient<Database>; // TODO : Deprecate
      dbWrapper: DBWrapper;
      clickhouse: ClickhouseClientWrapper;
      queue: RequestResponseStore;
      requestResponseManager: RequestResponseManager;
      kafkaProducer: KafkaProducer;
    },
    authParams: AuthParams,
    S3_ENABLED: Env["S3_ENABLED"],
    requestHeaders?: HeliconeHeaders
  ) {
    if (
      !authParams?.organizationId ||
      // Must be helicone api key or proxy key
      !requestHeaders?.heliconeAuthV2 ||
      (!requestHeaders?.heliconeAuthV2?.token &&
        !this.request.heliconeProxyKeyId)
    ) {
      return err(`Auth failed! ${authParams?.organizationId}`);
    }

    const org = await db.dbWrapper.getOrganization();

    if (org.error !== null) {
      return err(org.error);
    }

    const { body: rawResponseBody, endTime: responseEndTime } =
      await this.response.getResponseBody();

    if (S3_ENABLED === "true") {
      const s3Result = await db.requestResponseManager.storeRequestResponseRaw({
        organizationId: authParams.organizationId,
        requestId: this.request.requestId,
        requestBody: this.request.bodyText ?? "{}",
        responseBody: rawResponseBody,
      });

      if (s3Result.error) {
        console.error(
          `Error storing request response in S3: ${s3Result.error}`
        );
      }
    }

    const endTime = this.timing.endTime ?? responseEndTime;
    const kafkaMessage: KafkaMessage = {
      id: this.request.requestId,
      authorization: requestHeaders.heliconeAuthV2.token,
      heliconeMeta: {
        modelOverride: requestHeaders.modelOverride ?? undefined,
        omitRequestLog: requestHeaders.omitHeaders.omitRequest,
        omitResponseLog: requestHeaders.omitHeaders.omitResponse,
      },
      log: {
        request: {
          id: this.request.requestId,
          userId: this.request.userId ?? "",
          promptId: requestHeaders.promptId ?? "",
          properties: this.request.properties,
          heliconeApiKeyId: authParams.heliconeApiKeyId, // If undefined, proxy key id must be present
          heliconeProxyKeyId: this.request.heliconeProxyKeyId ?? undefined,
          targetUrl: this.request.targetUrl,
          provider: this.request.provider,
          bodySize: this.request.bodyText?.length ?? 0,
          path: this.request.path,
          threat: this.request.threat ?? undefined,
          countryCode: this.request.country_code ?? undefined,
          requestCreatedAt: this.request.startTime ?? new Date(),
          isStream: this.request.isStream,
          heliconeTemplate: this.request.heliconeTemplate ?? undefined,
        },
        response: {
          id: this.response.responseId,
          status: await this.response.status(),
          bodySize: rawResponseBody.length,
          timeToFirstToken: (await this.timing.timeToFirstToken()) ?? undefined,
          responseCreatedAt: endTime,
          delayMs: endTime.getTime() - this.timing.startTime.getTime(),
        },
      },
    };

    // Send to Kafka or REST if not enabled
    await db.kafkaProducer.sendMessage(kafkaMessage);

    return ok(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tryParseBody(body: string, bodyType: "request" | "response"): any {
    try {
      return JSON.parse(body);
    } catch (e) {
      console.error(`Error parsing ${bodyType} body: ${e}`);
      return {
        helicone_error: `error parsing ${bodyType} body: ${e}`,
        parse_response_error: e,
        body: body,
      };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  omitBody(omitBody: boolean, body: any, model: string): any {
    return omitBody
      ? {
          model: model,
        }
      : body;
  }

  processRequestBodyImages(
    model: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requestBody: any
  ): ImageModelParsingResponse {
    let imageModelParsingResponse: ImageModelParsingResponse = {
      body: requestBody,
      assets: new Map<string, string>(),
    };
    if (model && isRequestImageModel(model)) {
      const imageModelParser = getRequestImageModelParser(model);
      if (imageModelParser) {
        imageModelParsingResponse =
          imageModelParser.processRequestBody(requestBody);
      }
    }

    imageModelParsingResponse.body = unsupportedImage(
      imageModelParsingResponse.body
    );

    return imageModelParsingResponse;
  }

  processResponseBodyImages(
    model: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    responseBody: any
  ): ImageModelParsingResponse {
    let imageModelParsingResponse: ImageModelParsingResponse = {
      body: responseBody,
      assets: new Map<string, string>(),
    };
    if (model && isResponseImageModel(model)) {
      const imageModelParser = getResponseImageModelParser(model);
      if (imageModelParser) {
        imageModelParsingResponse =
          imageModelParser.processResponseBody(responseBody);
      }
    }

    imageModelParsingResponse.body = unsupportedImage(
      imageModelParsingResponse.body
    );

    return imageModelParsingResponse;
  }

  calculateModel(
    requestModel: string | null,
    responseModel: string | null,
    modelOverride: string | null
  ): string {
    return modelOverride ?? responseModel ?? requestModel ?? "not-found";
  }

  modelCost(modelRow: {
    model: string;
    provider: string;
    sum_prompt_tokens: number;
    sum_completion_tokens: number;
    sum_tokens: number;
  }): number {
    const model = modelRow.model;
    const promptTokens = modelRow.sum_prompt_tokens;
    const completionTokens = modelRow.sum_completion_tokens;
    return (
      costOfPrompt({
        model,
        promptTokens,
        completionTokens,
        provider: modelRow.provider,
      }) ?? 0
    );
  }
}

// Replaces all the image_url that is not a url or not { url: url }  with
// { unsupported_image: true }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unsupportedImage(body: any): any {
  if (typeof body !== "object" || body === null) {
    return body;
  }
  if (Array.isArray(body)) {
    return body.map((item) => unsupportedImage(item));
  }
  const notSupportMessage = {
    helicone_message:
      "Storing images as bytes is currently not supported within Helicone.",
  };
  if (body["image_url"] !== undefined) {
    const imageUrl = body["image_url"];
    if (
      typeof imageUrl === "string" &&
      !imageUrl.startsWith("http") &&
      !imageUrl.startsWith("<helicone-asset-id")
    ) {
      body.image_url = notSupportMessage;
    }
    if (
      typeof imageUrl === "object" &&
      imageUrl.url !== undefined &&
      typeof imageUrl.url === "string" &&
      !imageUrl.url.startsWith("http") &&
      !imageUrl.url.startsWith("<helicone-asset-id")
    ) {
      body.image_url = notSupportMessage;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  for (const key in body) {
    result[key] = unsupportedImage(body[key]);
  }
  return result;
}

export async function logRequest(
  request: DBLoggableProps["request"],
  responseId: string,
  dbClient: SupabaseClient<Database>,
  insertQueue: RequestResponseStore,
  authParams: AuthParams
): Promise<
  Result<
    {
      request: Database["public"]["Tables"]["request"]["Row"];
      properties: Database["public"]["Tables"]["properties"]["Insert"][];
      node: {
        id: string | null;
        job: string | null;
      };
      body: string; // For S3 storage
      requestAssets: Map<string, string>;
    },
    string
  >
> {
  try {
    if (!authParams.organizationId) {
      return { data: null, error: "Helicone organization not found" };
    }

    let bodyText = request.bodyText ?? "{}";
    bodyText = bodyText.replace(/\\u0000/g, ""); // Remove unsupported null character in JSONB

    let requestBody = {
      error: `error parsing request body: ${bodyText}`,
    };
    try {
      requestBody = JSON.parse(bodyText ?? "{}");
    } catch (e) {
      console.error("Error parsing request body", e);
    }

    const jobNode = request.nodeId
      ? await dbClient
          .from("job_node")
          .select("*")
          .eq("id", request.nodeId)
          .single()
      : null;
    if (jobNode && jobNode.error) {
      return { data: null, error: `No task found for id ${request.nodeId}` };
    }

    const getModelFromRequest = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (requestBody && (requestBody as any).model) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (requestBody as any).model;
      }

      const modelFromPath = getModelFromPath(request.path);
      if (modelFromPath) {
        return modelFromPath;
      }

      return null;
    };

    const body = request.omitLog
      ? {
          model:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (requestBody as any).model !== "undefined"
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (requestBody as any).model
              : null,
        }
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (requestBody as any);

    // eslint-disable-next-line prefer-const
    let imageModelParsingResponse: ImageModelParsingResponse = {
      body: body,
      assets: new Map<string, string>(),
    };
    const model = getModelFromRequest();

    if (model && isRequestImageModel(model)) {
      const imageModelParser = getRequestImageModelParser(model);
      if (imageModelParser) {
        imageModelParsingResponse = imageModelParser.processRequestBody(body);
      }
    }

    const reqBody = unsupportedImage(imageModelParsingResponse.body);

    const createdAt = request.startTime ?? new Date();
    const requestData = {
      id: request.requestId,
      path: request.path,
      body: reqBody, // TODO: Remove in favor of S3 storage
      auth_hash: "",
      user_id: request.userId ?? null,
      prompt_id: request.promptId ?? null,
      properties: request.properties,
      formatted_prompt_id: null,
      prompt_values: null,
      helicone_user: authParams.userId ?? null,
      helicone_api_key_id: authParams.heliconeApiKeyId ?? null,
      helicone_org_id: authParams.organizationId,
      provider: request.provider,
      helicone_proxy_key_id: request.heliconeProxyKeyId ?? null,
      model: model,
      model_override: request.modelOverride ?? null,
      created_at: createdAt.toISOString(),
      threat: request.threat ?? null,
      target_url: request.targetUrl,
      request_ip: null,
      country_code: request.country_code,
      version: 0,
    };

    const customPropertyRows = Object.entries(request.properties).map(
      (entry) => ({
        request_id: request.requestId,
        auth_hash: null,
        user_id: null,
        key: entry[0],
        value: entry[1],
        created_at: createdAt.toISOString(),
      })
    );

    const requestResult = await insertQueue.addRequest(
      requestData,
      customPropertyRows,
      responseId
    );

    if (requestResult.error) {
      return { data: null, error: requestResult.error };
    }
    if (jobNode && jobNode.data) {
      const jobNodeResult = await insertQueue.addRequestNodeRelationship(
        jobNode.data.job,
        jobNode.data.id,
        request.requestId
      );
      if (jobNodeResult.error) {
        return {
          data: null,
          error: `Node Relationship error: ${jobNodeResult.error}`,
        };
      }
    }

    return {
      data: {
        request: requestData,
        properties: customPropertyRows,
        node: {
          id: jobNode?.data.id ?? null,
          job: jobNode?.data.job ?? null,
        },
        body: imageModelParsingResponse.body,
        requestAssets: imageModelParsingResponse.assets,
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: JSON.stringify(e) };
  }

  function getModelFromPath(path: string) {
    const regex1 = /\/engines\/([^/]+)/;
    const regex2 = /models\/([^/:]+)/;

    let match = path.match(regex1);

    if (!match) {
      match = path.match(regex2);
    }

    if (match && match[1]) {
      return match[1];
    } else {
      return undefined;
    }
  }
}
