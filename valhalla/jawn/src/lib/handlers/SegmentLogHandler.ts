import * as Sentry from "@sentry/node";
import {
  PromiseGenericResult,
  Result,
  err,
  ok,
} from "../../packages/common/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import { formatTimeString } from "../stores/request/VersionedRequestStore";
import { KVCache } from "../cache/kvCache";
import { cacheResultCustom } from "../../utils/cacheResult";
import { dbExecute } from "../shared/db/dbExecute";

const kvCache = new KVCache(60 * 1000); // 5 minute
const SEGMENT_PROVIDER_NAME = "HELICONE_SEGMENT_KEY";

async function getSegmentConfig(
  organizationId: string
): Promise<Result<{ writeKey: string } | null, string>> {
  try {
    // Get active segment integration
    const integrationResult = await dbExecute<{
      id: string;
      integration_name: string;
    }>(
      `SELECT id, integration_name
       FROM integrations
       WHERE integration_name = $1
       AND organization_id = $2
       AND active = true
       LIMIT 1`,
      ["segment", organizationId]
    );

    if (
      integrationResult.error ||
      !integrationResult.data ||
      integrationResult.data.length === 0
    ) {
      return err("No active segment integration found");
    }

    // Get the decrypted provider key
    const writeKeyResult = await dbExecute<{ decrypted_provider_key: string }>(
      `SELECT decrypted_provider_key
       FROM decrypted_provider_keys_v2
       WHERE provider_name = $1
       AND org_id = $2
       LIMIT 1`,
      [SEGMENT_PROVIDER_NAME, organizationId]
    );

    if (
      writeKeyResult.error ||
      !writeKeyResult.data ||
      writeKeyResult.data.length === 0
    ) {
      console.error("Error fetching segment write key:", writeKeyResult.error);
      return err("Failed to fetch segment write key");
    }

    const writeKey = writeKeyResult.data[0].decrypted_provider_key;
    return ok({ writeKey });
  } catch (error) {
    console.error("Error getting segment config:", error);
    return err(String(error));
  }
}

async function sendSegmentEvent(segmentEvent: SegmentEvent) {
  return fetch("https://api.segment.io/v1/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(segmentEvent),
  });
}

interface SegmentEvent {
  event: "helicone-request";
  userId: string;
  writeKey: string;
  properties: {
    status: number;
    properties: Record<string, string>;
    model: string;
    provider: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    costUSD: number; // in cents
    countryCode: string;
    heliconeUrl: string;
    requestId: string;
    timestamp: string;

    timeToFirstTokenMs: number;
  };
}
export class SegmentLogHandler extends AbstractLogHandler {
  private segmentEvents: SegmentEvent[] = [];
  constructor() {
    super();
  }

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();
    context.timingMetrics.push({
      constructor: this.constructor.name,
      start,
    });
    const segmentConfig = await cacheResultCustom(
      `segment-config-${context.authParams?.organizationId}`,
      async () => getSegmentConfig(context.authParams?.organizationId ?? ""),
      kvCache
    );

    if (segmentConfig.error) {
      // console.error(segmentConfig.error);
      return await super.handle(context);
    }

    const segmentEvent = this.mapSegmentEvent(
      context,
      segmentConfig.data!.writeKey
    );

    this.segmentEvents.push(segmentEvent);

    return await super.handle(context);
  }

  public async handleResults(): PromiseGenericResult<string> {
    for (const segmentEvent of this.segmentEvents) {
      try {
        const response = await sendSegmentEvent(segmentEvent);
        if (!response.ok) {
          console.error("Failed to send segment event", await response.text());
        }
      } catch (error) {
        console.error(error);
      }
    }

    return ok("Successfully handled segment logs");
  }

  private mapSegmentEvent(
    context: HandlerContext,
    writeKey: string
  ): SegmentEvent {
    const request = context.message.log.request;
    const response = context.message.log.response;
    const usage = context.usage;

    return {
      event: "helicone-request",
      properties: {
        requestId: request.id,
        completionTokens: usage.completionTokens ?? 0,
        latencyMs: response.delayMs ?? 0,
        model: context.processedLog.model ?? "",
        promptTokens: usage.promptTokens ?? 0,
        timestamp: formatTimeString(request.requestCreatedAt.toISOString()),
        status: response.status ?? 0,
        timeToFirstTokenMs: response.timeToFirstToken ?? 0,
        provider: request.provider ?? "",
        countryCode: request.countryCode ?? "",
        properties: context.processedLog.request.properties ?? {},
        costUSD: context.usage.cost ?? 0,
        heliconeUrl: `${process.env.APP_URL || "https://us.helicone.ai"}/requests?requestId=${request.id}`,
      },
      userId: request.userId,
      writeKey,
    };
  }
}
