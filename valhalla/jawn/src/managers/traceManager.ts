import type { Log, Message } from "../lib/handlers/HandlerContext";
import { KafkaProducer } from "../lib/clients/KafkaProducer";
import util from "util";
import { AuthParams } from "../lib/db/supabase";
import { string } from "zod";
import { S3Client } from "../lib/shared/db/s3Client";

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

  public async consumeTraces(trace: OTELTrace, heliconeAuthorization: string, authParams: AuthParams) {

    const spans = trace.resourceSpans.flatMap((resourceSpan) => {
      return resourceSpan.scopeSpans.flatMap((scopeSpan) => {
        return scopeSpan.spans.map((span) => {

          const attributes: Map<string, any> = new Map();
          span.attributes.forEach(({ key, value }) => {
            attributes.set(key, value.stringValue ?? value.intValue);
          });

          const promptMessages: {
            role: "system" | "user",
            content: string
          }[] = []
          const completionMessages: {
            role: "assistant",
            content: string
          }[] = []

          let i = 0;
          while (true) {
            let x = 0;
            if (attributes.has(`gen_ai.prompt.${i}.role`)) {
              promptMessages.push({
                role: attributes.get(`gen_ai.prompt.${i}.role`),
                content: attributes.get(`gen_ai.prompt.${i}.content`),
              });
              x++;
            }

            if (attributes.has(`gen_ai.completion.${i}.role`)) {
              completionMessages.push({
                role: attributes.get(`gen_ai.completion.${i}.role`),
                content: attributes.get(`gen_ai.completion.${i}.content`),
              });
              x++;
            }

            if (x==0) break;
            i++;
          }


          return {
            traceId: span.traceId,
            spanId: span.spanId,
            name: span.name,
            kind: span.kind,
            startTimeUnixNano: span.startTimeUnixNano,
            endTimeUnixNano: span.endTimeUnixNano,
            attributes: attributes,
            promptMessages: promptMessages,
            completionMessages: completionMessages
          }
        })
      });
    });

    spans.forEach(async (span) => {

      console.log(util.inspect(span, false, null, true));

      const key = this.s3Client.getRawRequestResponseKey(span.traceId, authParams.organizationId);
      const s3Result = await this.s3Client.store(
        key,
        JSON.stringify({
          request: {
            model: span.attributes.get("gen_ai.response.model"),
            messages: span.promptMessages,
          },
          response: {
            id: span.traceId,
            object: span.attributes.get("llm.request.type"),
            messages: span.completionMessages,
          },
        }),
      );
      console.log(`Stored request response in S3: ${util.inspect(span, false, null, true)}, ${key}\n\n---`);
      if (s3Result.error) {
        console.error(
          `Error storing request response in S3: ${s3Result.error}`
        );
      }

      const log: Log = {
        request: {
          id: span.traceId,
          userId: authParams.userId ?? "",
          promptId: undefined,
          properties: {},
          heliconeApiKeyId: authParams.heliconeApiKeyId ?? undefined,
          heliconeProxyKeyId: undefined,
          targetUrl: "",
          provider: span.attributes.get("gen_ai.system"),
          bodySize: span.promptMessages.length,
          path: "traceloop-nopath",
          threat: false,
          countryCode: undefined,
          requestCreatedAt: new Date(parseInt(span.startTimeUnixNano) / 1000000),
          isStream: false,
          heliconeTemplate: undefined,
        },
        response: {
          id: span.traceId,
          status: 200,
          bodySize: span.completionMessages.length,
          timeToFirstToken: undefined,
          responseCreatedAt: new Date(parseInt(span.endTimeUnixNano) / 1000000),
          delayMs: 0,
        }
      }

      const kafkaMessage: Message = {
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
      }

      const result = await fetch(`http://127.0.0.1:8585/v1/log/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${kafkaMessage.authorization}`,
        },
        body: JSON.stringify({
          log: kafkaMessage.log,
          authorization: kafkaMessage.authorization,
          heliconeMeta: kafkaMessage.heliconeMeta,
        }),
      });

      //const kafkaProducer = new KafkaProducer();
      //const res = await kafkaProducer.sendMessages(
      //  [kafkaMessage],
      //  "request-response-logs-prod"
      //);

      //if (res.error) {
      //  console.error(
      //    `Error sending message to DLQ: ${res.error} for request ${log.request.id}`
      //  );
      //}
    });

  }
}

export type OTELTrace = {
  resourceSpans: Array<{
    resource: {
      attributes: Array<{
        key: string
        value: {
          stringValue?: string
          intValue?: number
          arrayValue?: {
            values: Array<{
              stringValue: string
            }>
          }
        }
      }>
      droppedAttributesCount: number
    }
    scopeSpans: Array<{
      scope: {
        name: string
        version: string
      }
      spans: Array<{
        traceId: string
        spanId: string
        name: string
        kind: number
        startTimeUnixNano: string
        endTimeUnixNano: string
        attributes: Array<{
          key: string
          value: {
            stringValue?: string
            intValue?: number
          }
        }>
        droppedAttributesCount: number
        events: Array<any>
        droppedEventsCount: number
        status: {
          code: number
        }
        links: Array<any>
        droppedLinksCount: number
      }>
    }>
  }>
}
