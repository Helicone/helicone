import type { Log, KafkaMessageContents } from "../lib/handlers/HandlerContext";
import { KafkaProducer } from "../lib/clients/KafkaProducer";
import { AuthParams } from "../lib/db/supabase";
import { S3Client } from "../lib/shared/db/s3Client";
import { randomUUID } from "crypto";

export class TraceManager {
  private s3Client: S3Client;
  constructor() {
    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY ?? "",
      process.env.S3_SECRET_KEY ?? "",
      process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );
  }

  private extractAttributes(span: TModifiedSpan, prefix: string, i: number) {
    return {
      role: span.attributes.get(`${prefix}.${i}.role`) as
        | "system"
        | "user"
        | "assistant",
      content: span.attributes.get(`${prefix}.${i}.content`) as string,
    };
  }

  private extractCompletion(span: TModifiedSpan, i: number) {
    return {
      index: i,
      logprobs: null,
      finish_reason: span.attributes.get(
        `gen_ai.completion.${i}.finish_reason`
      ) as string,
      message: this.extractAttributes(span, `gen_ai.completion`, i),
    };
  }

  private constructMessages(span: TModifiedSpan, prefix: string) {
    const seenKeys = new Set<number>();

    return Array.from(span.attributes.keys())
      .filter((key) => key.startsWith(prefix))
      .map((key) => parseInt(key.split(".")[2]))
      .filter((i) => {
        if (seenKeys.has(i)) return false;
        seenKeys.add(i);
        return true;
      })
      .reduce((acc, i) => {
        if (span.attributes.has(`${prefix}.${i}.role`)) {
          acc.push(this.extractAttributes(span, prefix, i));
        }
        return acc;
      }, [] as { role: "system" | "user" | "assistant"; content: string }[]);
  }

  private extractCompletions(span: TModifiedSpan) {
    const seenKeys = new Set<number>();

    return Array.from(span.attributes.keys())
      .filter((key) => key.startsWith("gen_ai.completion"))
      .map((key) => parseInt(key.split(".")[2]))
      .filter((i) => {
        if (seenKeys.has(i)) return false;
        seenKeys.add(i);
        return true;
      })
      .reduce(
        (acc, i) => {
          if (span.attributes.has(`gen_ai.completion.${i}.role`)) {
            acc.push(this.extractCompletion(span, i));
          }
          return acc;
        },
        [] as {
          index: number;
          logprobs: null;
          finish_reason: string;
          message: {
            role: "system" | "user" | "assistant";
            content: string;
          };
        }[]
      );
  }

  private async storeRawLogsS3(
    span: TModifiedSpan,
    requestBody: TRequestBody,
    responseBody: TResponseBody,
    authParams: AuthParams
  ) {
    const key = this.s3Client.getRawRequestResponseKey(
      span.traceId,
      authParams.organizationId
    );
    const s3Result = await this.s3Client.store(
      key,
      JSON.stringify({
        request: JSON.stringify(requestBody),
        response: JSON.stringify(responseBody),
      })
    );
    if (s3Result.error) {
      console.error(`Error storing request response in S3: ${s3Result.error}`);
    }
  }

  private constructLog(
    span: TModifiedSpan,
    promptMessages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[],
    completionChoices: TCompletionChoices,
    heliconeProperties: Record<string, string>,
    authParams: AuthParams,
    userId?: string
  ): Log {
    return {
      request: {
        id: span.traceId,
        userId: userId ?? "",
        promptId: undefined,
        properties: heliconeProperties,
        heliconeApiKeyId: authParams.heliconeApiKeyId ?? undefined,
        heliconeProxyKeyId: undefined,
        targetUrl: "",
        provider:
          (span.attributes.get("gen_ai.system") ?? "").toUpperCase() ??
          undefined,
        bodySize: JSON.stringify(promptMessages).length,
        path: "async-unknown-path",
        threat: false,
        countryCode: undefined,
        requestCreatedAt: new Date(parseInt(span.startTimeUnixNano) / 1000000),
        isStream: false,
        heliconeTemplate: undefined,
      },
      response: {
        id: span.traceId,
        status: 200,
        bodySize: JSON.stringify(completionChoices).length,
        timeToFirstToken: undefined,
        responseCreatedAt: new Date(parseInt(span.endTimeUnixNano) / 1000000),
        delayMs:
          span.endTimeUnixNano && span.startTimeUnixNano
            ? Math.trunc(
                (parseInt(span.endTimeUnixNano) -
                  parseInt(span.startTimeUnixNano)) /
                  1000000
              )
            : -1,
      },
    };
  }

  private async sendLogToKafka(kafkaMessage: KafkaMessageContents) {
    const kafkaProducer = new KafkaProducer();
    await kafkaProducer.sendMessages(
      [kafkaMessage],
      "request-response-logs-prod"
    );
  }

  private processOtelSpans(trace: OTELTrace): TModifiedSpan[] {
    return trace.resourceSpans.flatMap((resourceSpan) =>
      resourceSpan.scopeSpans.flatMap((scopeSpan) =>
        scopeSpan.spans.map((span) => {
          const attributes: Map<string, any> = new Map();
          span.attributes.forEach(({ key, value }) => {
            attributes.set(key, value.stringValue ?? value.intValue);
          });

          const uuid = randomUUID();
          return {
            ...span,
            traceId: uuid,
            attributes: attributes,
          };
        })
      )
    );
  }

  public async consumeTraces(
    trace: OTELTrace,
    heliconeAuthorization: string,
    authParams: AuthParams
  ) {
    const spans = this.processOtelSpans(trace);

    for (const span of spans) {
      const promptMessages = this.constructMessages(span, "gen_ai.prompt");
      const completionChoices = this.extractCompletions(span);

      const userId =
        span.attributes.get(
          "traceloop.association.properties.Helicone-User-Id"
        ) ??
        span.attributes.get("llm.user") ??
        "";

      const heliconeProperties = Array.from(span.attributes.entries())
        .filter(
          ([key]) =>
            key.startsWith("traceloop.association.properties.Helicone-") &&
            key !== "traceloop.association.properties.Helicone-User-Id"
        )
        .reduce((acc, [key, value]) => {
          const propertyName = key.replace(
            key.startsWith(
              "traceloop.association.properties.Helicone-Property-"
            )
              ? "traceloop.association.properties.Helicone-Property-"
              : "traceloop.association.properties.",
            ""
          );
          acc[propertyName] = value;
          return acc;
        }, {} as Record<string, string>);

      const requestBody = {
        model: span.attributes.get("gen_ai.response.model"),
        n: completionChoices.length,
        messages: promptMessages,
        temperature: 1,
        max_tokens: span.attributes.get("gen_ai.response.max_tokens") ?? 50,
        stream: false,
      };

      const responseBody = {
        id: span.traceId,
        object: span.attributes.get("llm.request.type"),
        created: new Date(parseInt(span.startTimeUnixNano) / 1000000),
        model: span.attributes.get("gen_ai.response.model"),
        choices: completionChoices,
        usage: {
          prompt_tokens: span.attributes.get("gen_ai.usage.prompt_tokens"),
          completion_tokens: span.attributes.get(
            "gen_ai.usage.completion_tokens"
          ),
          total_tokens: span.attributes.get("llm.usage.total_tokens"),
        },
        system_fingerprint: null,
      };

      await this.storeRawLogsS3(span, requestBody, responseBody, authParams);

      const log = this.constructLog(
        span,
        promptMessages,
        completionChoices,
        heliconeProperties,
        authParams,
        userId
      );

      const kafkaMessage: KafkaMessageContents = {
        authorization: heliconeAuthorization,
        heliconeMeta: {
          modelOverride: undefined,
          omitResponseLog: false,
          omitRequestLog: false,
          webhookEnabled: false,
          posthogHost: undefined,
          posthogApiKey: undefined,
        },
        log: log,
      };

      await this.sendLogToKafka(kafkaMessage);
    }
  }
}

export type OTELTrace = {
  resourceSpans: Array<{
    resource: {
      attributes: Array<{
        key: string;
        value: {
          stringValue?: string;
          intValue?: number;
          arrayValue?: {
            values: Array<{
              stringValue: string;
            }>;
          };
        };
      }>;
      droppedAttributesCount: number;
    };
    scopeSpans: Array<{
      scope: {
        name: string;
        version: string;
      };
      spans: Array<{
        traceId: string;
        spanId: string;
        name: string;
        kind: number;
        startTimeUnixNano: string;
        endTimeUnixNano: string;
        attributes: Array<{
          key: string;
          value: {
            stringValue?: string;
            intValue?: number;
          };
        }>;
        droppedAttributesCount: number;
        events: Array<any>;
        droppedEventsCount: number;
        status: {
          code: number;
        };
        links: Array<any>;
        droppedLinksCount: number;
      }>;
    }>;
  }>;
};

type TModifiedSpan = {
  traceId: string;
  spanId: string;
  name: string;
  kind: number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: Map<string, any>;
  droppedAttributesCount: number;
  events: Array<any>;
  droppedEventsCount: number;
  status: {
    code: number;
  };
  links: Array<any>;
  droppedLinksCount: number;
};

type TRequestBody = {
  model: any;
  n: number;
  messages: {
    role: "system" | "user" | "assistant";
    content: string;
  }[];
  temperature: number;
  max_tokens: any;
  stream: boolean;
};

type TResponseBody = {
  id: string;
  object: string;
  created: Date;
  model: string;
  choices: TCompletionChoices;
  usage: {
    prompt_tokens: string;
    completion_tokens: string;
    total_tokens: string;
  };
  system_fingerprint: null;
};

type TCompletionChoices = {
  index: number;
  logprobs: null;
  finish_reason: string;
  message: {
    role: "system" | "user" | "assistant";
    content: string;
  };
}[];
