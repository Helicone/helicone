import type { Log, Message } from "../lib/handlers/HandlerContext";
import { KafkaProducer } from "../lib/clients/KafkaProducer";
import util from "util";

export class TraceManager {
  public async consumeTraces(trace: OTELTrace, heliconeAuthorization: string) {

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
            attributes: attributes,
          }
        })
      });
    });

    spans.forEach(async (span) => {

      const log: Log = {
        request: {
          id: "traceloopid-" + span.traceId,
          userId: "spanid-" + span.traceId,
          promptId: undefined,
          properties: {},
          heliconeApiKeyId: undefined,
          heliconeProxyKeyId: undefined,
          targetUrl: "traceloop-nourl",
          provider: span.attributes.get("gen_ai.system"),
          bodySize: 0, // span.attributes.get("gen_ai.usage.prompt_tokens"),
          path: "traceloop-nopath",
          threat: false,
          countryCode: undefined,
          requestCreatedAt: new Date(parseInt(span.startTimeUnixNano) / 1000000),
          isStream: false,
          heliconeTemplate: undefined,
        },
        response: {
          id: "traceloopid-" + span.traceId,
          status: 200,
          bodySize: 0, //span.attributes.get("gen_ai.usage.completion_tokens"),
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
      console.log(util.inspect(kafkaMessage, false, null, true));

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
