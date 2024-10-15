import { HeliconeHeaders } from "../../../../../shared/proxy/heliconeHeaders";
import { Provider } from "../../models/models";
import { PromptSettings } from "../requestWrapper/requestWrapper";
import { err, ok } from "../shared/result";
import { HeliconeProxyRequest } from "./HeliconeProxyRequest";
import { KafkaProducer } from "../clients/KafkaProducer";
import { AuthParams, OrgParams } from "../db/supabase";
import { S3Manager } from "./S3Manager";
import { Message } from "../handlers/HandlerContext";
import { Headers } from "node-fetch";
import { TemplateWithInputs } from "@helicone/prompts/dist/objectParser";

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
    country_code: null,
  };
}

export class DBLoggable {
  private response: DBLoggableProps["response"];
  private request: DBLoggableProps["request"];
  private timing: DBLoggableProps["timing"];

  constructor(props: DBLoggableProps) {
    this.response = props.response;
    this.request = props.request;
    this.timing = props.timing;
  }

  async log(
    db: {
      s3Manager: S3Manager;
      kafkaProducer: KafkaProducer;
    },
    authParams: AuthParams,
    orgParams: OrgParams,
    requestHeaders?: HeliconeHeaders<Headers>
  ) {
    // TODO: Add logging rate limiting
    if (
      !orgParams?.id ||
      // Must be helicone api key or proxy key
      !requestHeaders?.heliconeAuthV2 ||
      (!requestHeaders?.heliconeAuthV2?.token &&
        !this.request.heliconeProxyKeyId)
    ) {
      return err(`Auth failed for org ${orgParams?.id}`);
    }

    const { body: rawResponseBody, endTime: responseEndTime } =
      await this.response.getResponseBody();

    const s3Result = await db.s3Manager.storeRequestResponseRaw({
      organizationId: orgParams.id,
      requestId: this.request.requestId,
      requestBody: this.request.bodyText ?? "{}",
      responseBody: rawResponseBody,
    });

    if (s3Result.error) {
      console.error(`Error storing request response in S3: ${s3Result.error}`);
    }

    const endTime = this.timing.endTime ?? responseEndTime;
    const kafkaMessage: Message = {
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
    await db.kafkaProducer.sendMessages(
      [kafkaMessage],
      "request-response-logs-prod"
    );

    return ok(null);
  }
}
