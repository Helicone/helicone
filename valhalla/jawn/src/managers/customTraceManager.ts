import { HeliconeHeaders } from "../../../../shared/proxy/heliconeHeaders";
import { HeliconeQueueProducer } from "../lib/clients/HeliconeQueueProducer";
import type { KafkaMessageContents } from "../lib/handlers/HandlerContext";
import { S3Client } from "../lib/shared/db/s3Client";
import { AuthParams } from "../packages/common/auth/types";
import { Provider } from "@helicone-package/llm-mapper/types";

export type AsyncLogModel = {
  providerRequest: ProviderRequest;
  providerResponse: ProviderResponse;
  timing?: Timing;
  provider?: Provider;
};

type ProviderRequest = {
  url: string;
  json: {
    [key: string]: any;
  };
  meta: Record<string, string>;
};

type ProviderResponse = {
  json: {
    [key: string]: any;
  };
  textBody?: string;
  status: number;
  headers: Record<string, string>;
};

type Timing = {
  // From Unix epoch in Milliseconds
  timeToFirstToken?: number;
  startTime:
    | {
        seconds: number;
        milliseconds: number;
      }
    | string;
  endTime:
    | {
        seconds: number;
        milliseconds: number;
      }
    | string;
};

const getTime = (
  time:
    | {
        seconds: number;
        milliseconds: number;
      }
    | string,
) => {
  if (typeof time === "string") {
    if (/^\d+$/.test(time)) {
      const timestamp = parseInt(time);
      return timestamp < 4102444800
        ? new Date(timestamp * 1000)
        : new Date(timestamp);
    }
    return new Date(time);
  }
  return new Date(time.seconds * 1000 + time.milliseconds);
};

function mergeHeaders(x: Headers, y: Headers) {
  const merged = new Headers();
  for (const [key, value] of x.entries()) {
    merged.set(key, value);
  }
  for (const [key, value] of y.entries()) {
    merged.set(key, value);
  }
  return merged;
}
export class CustomTraceManager {
  private s3Client: S3Client;
  constructor() {
    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY || undefined,
      process.env.S3_SECRET_KEY || undefined,
      process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      process.env.S3_REGION ?? "",
    );
  }

  private async storeRawLogsS3({
    requestBody,
    responseBody,
    requestId,
    organizationId,
  }: {
    requestBody: string;
    responseBody: string;
    requestId: string;
    organizationId: string;
  }) {
    const key = this.s3Client.getRawRequestResponseKey(
      requestId,
      organizationId,
    );
    const s3Result = await this.s3Client.store(
      key,
      JSON.stringify({
        request: requestBody,
        response: responseBody,
      }),
    );
    if (s3Result.error) {
      console.error(`Error storing request response in S3: ${s3Result.error}`);
    }
  }

  private async sendLogToKafka(kafkaMessage: KafkaMessageContents) {
    const kafkaProducer = new HeliconeQueueProducer();
    await kafkaProducer.sendMessages(
      [kafkaMessage],
      "request-response-logs-prod",
    );
  }

  public async consumeLog(
    asyncLog: AsyncLogModel,
    requestWrapperHeaders: Headers,
    authorization: string,
    authParams: AuthParams,
  ) {
    const requestHeaders = new Headers(asyncLog.providerRequest.meta);
    const heliconeHeaders = new HeliconeHeaders(
      mergeHeaders(requestHeaders, requestWrapperHeaders),
    );

    const requestBodyString = JSON.stringify(asyncLog.providerRequest.json);
    const responseBodyString = asyncLog.providerResponse.textBody
      ? asyncLog.providerResponse.textBody
      : JSON.stringify(asyncLog.providerResponse.json);

    await this.storeRawLogsS3({
      requestId: heliconeHeaders.requestId,
      organizationId: authParams.organizationId,
      requestBody: requestBodyString,
      responseBody: responseBodyString,
    });

    const startTime = asyncLog.timing
      ? getTime(asyncLog.timing.startTime)
      : new Date();
    const endTime = asyncLog.timing
      ? getTime(asyncLog.timing.endTime)
      : new Date();
    const kafkaMessage: KafkaMessageContents = {
      authorization: authorization,
      heliconeMeta: {
        modelOverride: heliconeHeaders.modelOverride ?? "",
        omitResponseLog: heliconeHeaders.omitHeaders.omitResponse ?? false,
        omitRequestLog: heliconeHeaders.omitHeaders.omitRequest ?? false,
        webhookEnabled: heliconeHeaders.webhookEnabled ?? false,
        posthogHost: heliconeHeaders.posthogHost ?? undefined,
        posthogApiKey: heliconeHeaders.posthogKey ?? undefined,
      },
      log: {
        request: {
          bodySize: requestBodyString.length,
          path: "async-unknown-path",
          id: heliconeHeaders.requestId,
          isStream: false,
          properties: heliconeHeaders.heliconeProperties,
          provider: asyncLog.provider ?? "OPENAI",
          targetUrl: "",
          requestCreatedAt: startTime,
          userId: heliconeHeaders.userId ?? "",
        },
        response: {
          id: heliconeHeaders.requestId,
          status: asyncLog.providerResponse.status,
          bodySize: responseBodyString.length,
          timeToFirstToken: asyncLog.timing?.timeToFirstToken ?? undefined,
          responseCreatedAt: endTime,
          delayMs: endTime.getTime() - startTime.getTime(),
        },
      },
    };

    await this.sendLogToKafka(kafkaMessage);
  }
}
