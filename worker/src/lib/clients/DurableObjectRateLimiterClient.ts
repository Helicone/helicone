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
  organizationId: string | undefined;
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
  organizationId: string | undefined,
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
    const response = await doStub.fetch("http://rate-limiter/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok && response.status !== 429) {
      console.error("[DORateLimit] DO returned error status:", response.status);
      return { status: "ok", limit: quota, remaining: quota };
    }

    const doResponse: DORateLimitResponse = await response.json();

    return {
      status: doResponse.status,
      limit: doResponse.limit,
      remaining: doResponse.remaining,
      reset: doResponse.reset,
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

  // Get the Durable Object instance
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
    checkOnly: false, // Actually update the counter
  };

  console.log("[DORateLimit] Updating counter with:", request);

  try {
    const response = await doStub.fetch("http://rate-limiter/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok && response.status !== 429) {
      console.error(
        "[DORateLimit] Update failed with status:",
        response.status
      );
    } else if (response.status === 429) {
      console.log(
        "[DORateLimit] Update rejected due to rate limit - this is expected behavior"
      );
    }
  } catch (error) {
    console.error("[DORateLimit] Error updating counter:", error);
    // Silently fail on update errors to not block the request
  }
}
