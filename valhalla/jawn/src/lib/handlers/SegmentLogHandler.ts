import * as Sentry from "@sentry/node";
import { PromiseGenericResult, Result, err, ok } from "../shared/result";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";
import { formatTimeString } from "../stores/request/VersionedRequestStore";
import { supabaseServer } from "../db/supabase";
import { KVCache } from "../cache/kvCache";
import { cacheResultCustom } from "../../utils/cacheResult";

const kvCache = new KVCache(60 * 1000); // 5 minute
const SEGMENT_PROVIDER_NAME = "HELICONE_SEGMENT_KEY";

async function getSegmentConfig(
  organizationId: string
): Promise<Result<{ writeKey: string } | null, string>> {
  const { data, error } = await supabaseServer.client
    .from("integrations")
    .select("*")
    .eq("integration_name", "segment")
    .eq("organization_id", organizationId)
    .eq("active", true);

  const config = data?.[0];

  if (!config) {
    return err("No active segment integration found");
  }

  const { data: writeKeyData, error: writeKeyError } =
    await supabaseServer.client
      .from("decrypted_provider_keys")
      .select("*")
      .eq("provider_name", SEGMENT_PROVIDER_NAME)
      .eq("org_id", organizationId);

  if (writeKeyError) {
    console.error(writeKeyError);
    return err(writeKeyError.message);
  }

  const writeKey = writeKeyData?.[0]?.decrypted_provider_key!;

  return ok({ writeKey });
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
  status: number;
  properties: Record<string, string>;
  model: string;
  provider: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  user: string;
  costUSD: number; // in cents
  countryCode: string;
  heliconeUrl: string;
  requestId: string;
  timestamp: string;
  writeKey: string;
  timeToFirstTokenMs: number;
}
export class SegmentLogHandler extends AbstractLogHandler {
  private segmentEvents: SegmentEvent[] = [];
  constructor() {
    super();
  }

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const segmentConfig = await cacheResultCustom(
      `segment-config-${context.authParams?.organizationId}`,
      async () => getSegmentConfig(context.authParams?.organizationId ?? ""),
      kvCache
    );

    if (segmentConfig.error) {
      // console.error(segmentConfig.error);
      return ok("no segment config found");
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
        await sendSegmentEvent(segmentEvent);
      } catch (error) {
        console.error(error);
      }
    }

    return ok("Successfully handled lytix logs");
  }

  private mapSegmentEvent(
    context: HandlerContext,
    writeKey: string
  ): SegmentEvent {
    const request = context.message.log.request;
    const response = context.message.log.response;
    const usage = context.usage;

    return {
      // writeKey: context.message.heliconeMeta.segmentWriteKey,
      user: request.userId,
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
      heliconeUrl: `https://us.helicone.ai/requests?requestId=${request.id}`,
      writeKey,
    };
  }
}
