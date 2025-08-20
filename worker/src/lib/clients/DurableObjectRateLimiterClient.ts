import { HeliconeProperties } from "../models/HeliconeProxyRequest";
import {
  RateLimitRequest,
  RateLimitResponse as DORateLimitResponse,
  RateLimiterDO,
} from "../durable-objects/RateLimiterDO";

export interface RateLimitOptions {
  time_window: number;
  segment: string | undefined;
  quota: number;
  unit: "request" | "cents";
}

export interface RateLimitResponse {
  status: "ok" | "rate_limited";
  limit: number;
  remaining: number;
  reset?: number;
}

interface RateLimitProps {
  heliconeProperties: HeliconeProperties;
  userId: string | undefined;
  rateLimitOptions: RateLimitOptions;
  organizationId: string;
  rateLimiterDO: DurableObjectNamespace<RateLimiterDO>;
  cost: number;
}

async function getSegmentKeyValue(
  properties: HeliconeProperties,
  userId: string | undefined,
  segment: string | undefined
): Promise<string> {
  if (segment === undefined) {
    return "global";
  } else if (segment === "user") {
    if (userId === undefined) {
      throw new Error("Missing user ID");
    }
    return `user=${userId}`;
  } else {
    const headerValue = properties[segment.toLowerCase()];
    if (headerValue === undefined) {
      throw new Error(`Missing "${segment}" header`);
    }
    return `${segment.toLowerCase()}=${headerValue}`;
  }
}

function getDurableObjectId(
  namespace: DurableObjectNamespace<RateLimiterDO>,
  organizationId: string,
  segmentKeyValue: string
): DurableObjectId {
  const idString = `${organizationId || "default"}_${segmentKeyValue}`;
  return namespace.idFromName(idString);
}

export async function checkRateLimit(
  props: RateLimitProps
): Promise<RateLimitResponse> {
  const {
    heliconeProperties,
    userId,
    rateLimitOptions,
    organizationId,
    rateLimiterDO,
  } = props;
  const { time_window, segment, quota, unit } = rateLimitOptions;

  const segmentKeyValue = await getSegmentKeyValue(
    heliconeProperties,
    userId,
    segment
  );

  const doId = getDurableObjectId(
    rateLimiterDO,
    organizationId,
    segmentKeyValue
  );
  const doStub = rateLimiterDO.get(doId);

  const request: RateLimitRequest = {
    segmentKey: segmentKeyValue,
    timeWindow: time_window,
    quota,
    unit,
    cost: props.cost,
    checkOnly: true,
  };

  try {
    const response = await doStub.processRateLimit(request);
    return {
      status: response.status,
      limit: response.limit,
      remaining: response.remaining,
      reset: response.reset,
    };
  } catch (error) {
    console.error("[DORateLimit] Error calling DO:", error);
    return { status: "ok", limit: quota, remaining: quota };
  }
}

export async function updateRateLimitCounter(
  props: RateLimitProps
): Promise<void> {
  const {
    heliconeProperties,
    userId,
    rateLimitOptions,
    organizationId,
    rateLimiterDO,
  } = props;
  const { time_window, segment, quota, unit } = rateLimitOptions;

  const segmentKeyValue = await getSegmentKeyValue(
    heliconeProperties,
    userId,
    segment
  );

  const doId = getDurableObjectId(
    rateLimiterDO,
    organizationId,
    segmentKeyValue
  );

  try {
    const doStub = rateLimiterDO.get(doId);

    const request: RateLimitRequest = {
      segmentKey: segmentKeyValue,
      timeWindow: time_window,
      quota,
      unit,
      cost: props.cost,
      checkOnly: false,
    };

    const response = await doStub.processRateLimit(request);
    if (response.status !== "ok") {
      console.error("[DORateLimit] Update failed:", response.status);
    }
  } catch (error) {
    console.error("[DORateLimit] Update error:", error);
  }
}
