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

          return {
            traceId: span.traceId,
            spanId: span.spanId,
            name: span.name,
            kind: span.kind,
            startTimeUnixNano: span.startTimeUnixNano,
            endTimeUnixNano: span.endTimeUnixNano,
            attributes: attributes
          }
        })
      });
    });

    spans.forEach(async (span) => {
      let i = 0;
      const promptMessages: {
        role: "system" | "user" | "assistant",
        content: string
      }[] = []
      const completionChoices: {
        index: number,
        logprobs: null,
        finish_reason: string,
        message: {
          role: "system" | "user" | "assistant",
          content: string
        }
    }[] = []

      while (true) {
        let x = 0;
        if (span.attributes.has(`gen_ai.prompt.${i}.role`)) {
          promptMessages.push({
            role: span.attributes.get(`gen_ai.prompt.${i}.role`),
            content: span.attributes.get(`gen_ai.prompt.${i}.content`),
          });
          x++;
        }

        if (span.attributes.has(`gen_ai.completion.${i}.role`)) {
          completionChoices.push({
            index: i,
            logprobs: null,
            finish_reason: span.attributes.get(`gen_ai.completion.${i}.finish_reason`) as string,
            message: {
              role: span.attributes.get(`gen_ai.completion.${i}.role`) as "system" | "user" | "assistant",
              content: span.attributes.get(`gen_ai.completion.${i}.content`) as string,
            }
          });
          x++;
        }

        if (x==0) break;
        i++;
      }

      const requestBody = {
          model: span.attributes.get("gen_ai.response.model"),
          n: i,
          messages: promptMessages,
          temperature: 1,
          max_tokens: span.attributes.get("gen_ai.response.max_tokens") ?? 50,
          stream: false
        }

      const key = this.s3Client.getRawRequestResponseKey(span.traceId, authParams.organizationId);
      const s3Result = await this.s3Client.store(
        key,
        JSON.stringify({
          request: requestBody,
          response: completionChoices,
        }),
      );
      if (s3Result.error) {
        console.error(
          `Error storing request response in S3: ${s3Result.error}`
        );
      }

      console.log("\n--------SENT TO S3---------\n", JSON.stringify({ request: requestBody, response: completionChoices }), "\n");

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
          bodySize: JSON.stringify(promptMessages).length,
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
          bodySize: JSON.stringify(completionChoices).length,
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
