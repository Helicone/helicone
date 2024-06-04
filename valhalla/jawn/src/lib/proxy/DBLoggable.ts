import { SupabaseClient } from "@supabase/supabase-js";
import { HeliconeHeaders } from "../../models/HeliconeHeaders";
import { Provider } from "../../models/models";
import { getTokenCount } from "../../utils/helpers";
import { TemplateWithInputs } from "../../utils/promptHelpers";
import { Json } from "../db/database.types";
import { INTERNAL_ERRORS } from "../handlers/ResponseBodyHandler";
import {
  PromptSettings,
  RequestWrapper,
} from "../requestWrapper/requestWrapper";
import { Result, ok } from "../shared/result";
import { HeliconeProxyRequest } from "./HeliconeProxyRequest";

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
    promptSettings: PromptSettings;
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
    promptSettings: proxyRequest.requestWrapper.promptSettings,
    heliconeTemplate: proxyRequest.heliconePromptTemplate ?? undefined,
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
    threat: proxyRequest.threat ?? null,
    flaggedForModeration: proxyRequest.flaggedForModeration ?? null,
    request_ip: null,
    country_code: (proxyRequest.requestWrapper.cf?.country as string) ?? null,
  };
}

interface DBLoggableRequestFromAsyncLogModelProps {
  requestWrapper: RequestWrapper;
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
    asyncLogModel,
    providerRequestHeaders,
    providerResponseHeaders,
    provider,
  } = props;

  return new DBLoggable({
    request: {
      requestId: providerRequestHeaders.requestId ?? crypto.randomUUID(),
      promptSettings: requestWrapper.promptSettings,
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
      country_code: null,
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
    tokenCalcUrl: "",
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
    requestHeaders?: HeliconeHeaders
  ): Promise<Result<undefined, string>> {
    const { data: authParams, error } = await db.dbWrapper.getAuthParams();
    if (error || !authParams?.organizationId) {
      return err(`Auth failed! ${error}` ?? "Helicone organization not found");
    }

    try {
      const org = await db.dbWrapper.getOrganization();
      if (org.error !== null) {
        return err(org.error);
      }

      const tier = org.data?.tier;

      const rateLimiter = await db.dbWrapper.getRateLimiter();
      if (rateLimiter.error !== null) {
        return rateLimiter;
      }

      const rateLimit = await rateLimiter.data.checkRateLimit(tier);

      if (rateLimit.error) {
        console.error(`Error checking rate limit: ${rateLimit.error}`);
      }

      if (!rateLimit.error && rateLimit.data?.isRateLimited) {
        await db.clickhouse.dbInsertClickhouse("rate_limit_log_v2", [
          {
            request_id: this.request.requestId,
            organization_id: org.data.id,
            tier: tier,
            rate_limit_created_at: formatTimeStringDateTime(
              new Date().toISOString()
            ),
          },
        ]);
        return ok(undefined);
      }
    } catch (e) {
      console.error(`Error checking rate limit: ${e}`);
    }

    await this.useKafka(db, authParams, S3_ENABLED, requestHeaders);

    return ok(undefined);
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
        webhookEnabled: requestHeaders.webhookEnabled,
        posthogApiKey: requestHeaders.posthogKey ?? undefined,
        posthogHost: requestHeaders.posthogHost ?? undefined,
      },
      log: {
        request: {
          id: this.request.requestId,
          userId: this.request.userId ?? "",
          promptId:
            this.request.promptSettings.promptMode === "production"
              ? this.request.promptSettings.promptId
              : "",
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
      prompt_id:
        request.promptSettings.promptMode === "production"
          ? request.promptSettings.promptId
          : null,
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
