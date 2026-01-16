import { HeliconeProperties } from "../models/HeliconeProxyRequest";
import {
  RateLimitRequest,
  RateLimitResponse as DORateLimitResponse,
  RateLimiterDO,
} from "../durable-objects/RateLimiterDO";
import { DataDogTracer, TraceContext } from "../monitoring/DataDogTracer";

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
  tracer?: DataDogTracer;
  traceContext?: TraceContext | null;
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

// Get just the raw segment value for logging (without the key= prefix)
function getRawSegmentValue(
  properties: HeliconeProperties,
  userId: string | undefined,
  segment: string | undefined
): string {
  if (segment === undefined) {
    return "global";
  } else if (segment === "user") {
    return userId ?? "unknown";
  } else {
    return properties[segment.toLowerCase()] ?? "unknown";
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
    tracer,
    traceContext,
  } = props;
  const { time_window, segment, quota, unit } = rateLimitOptions;

  // Get segment value for DO key (includes prefix like "tenant-id=value")
  const segmentKeyValue = await getSegmentKeyValue(
    heliconeProperties,
    userId,
    segment
  );

  // Get raw segment value for logging (just the value, e.g., "tenant-1")
  const rawSegmentValue = getRawSegmentValue(
    heliconeProperties,
    userId,
    segment
  );

  // Generate a policy_id for grouping in dashboards
  // Format: org_segment_quota_window_unit (e.g., "abc123_tenant-id_100_60_request")
  const policyId = `${organizationId}_${segment ?? "global"}_${quota}_${time_window}_${unit}`;

  // Start tracing span if tracer is available
  const spanId =
    tracer && traceContext?.sampled
      ? tracer.startSpan(
          "rate_limit.check",
          "checkRateLimit",
          "rate-limiter",
          {
            org_id: organizationId,
            policy_id: policyId,
            segment: segment ?? "global",
            segment_value: rawSegmentValue,
          },
          traceContext
        )
      : null;

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
    const result: RateLimitResponse = {
      status: response.status,
      limit: response.limit,
      remaining: response.remaining,
      reset: response.reset,
    };

    // Add result tags to span
    if (tracer && spanId) {
      tracer.setTag(
        spanId,
        "rate_limited",
        response.status === "rate_limited" ? "true" : "false"
      );
      tracer.setTag(spanId, "remaining", response.remaining);
      tracer.setTag(spanId, "time_window_seconds", time_window);
      tracer.setTag(spanId, "quota_limit", quota);
      tracer.setTag(spanId, "rate_limit_unit", unit);
      tracer.finishSpan(spanId);
    }

    return result;
  } catch (error) {
    // Set error on span
    if (tracer && spanId) {
      tracer.setError(spanId, error instanceof Error ? error : String(error));
      tracer.finishSpan(spanId);
    }
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
    tracer,
    traceContext,
  } = props;
  const { time_window, segment, quota, unit } = rateLimitOptions;

  // Get segment value for DO key (includes prefix like "tenant-id=value")
  const segmentKeyValue = await getSegmentKeyValue(
    heliconeProperties,
    userId,
    segment
  );

  // Get raw segment value for logging (just the value, e.g., "tenant-1")
  const rawSegmentValue = getRawSegmentValue(
    heliconeProperties,
    userId,
    segment
  );

  // Generate a policy_id for grouping in dashboards
  const policyId = `${organizationId}_${segment ?? "global"}_${quota}_${time_window}_${unit}`;

  // Start tracing span if tracer is available
  const spanId =
    tracer && traceContext?.sampled
      ? tracer.startSpan(
          "rate_limit.update",
          "updateRateLimitCounter",
          "rate-limiter",
          {
            org_id: organizationId,
            policy_id: policyId,
            segment: segment ?? "global",
            segment_value: rawSegmentValue,
          },
          traceContext
        )
      : null;

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
    if (tracer && spanId) {
      tracer.setTag(spanId, "time_window_seconds", time_window);
      tracer.setTag(spanId, "quota_limit", quota);
      tracer.setTag(spanId, "rate_limit_unit", unit);
      tracer.setTag(spanId, "cost", props.cost);
    }
    if (response.status !== "ok") {
      console.error("[DORateLimit] Update failed:", response.status);
      if (tracer && spanId) {
        tracer.setTag(spanId, "update_failed", "true");
        tracer.setTag(spanId, "update_status", response.status);
      }
    } else if (tracer && spanId) {
      tracer.setTag(spanId, "update_success", "true");
      tracer.setTag(spanId, "new_remaining", response.remaining);
    }

    if (tracer && spanId) {
      tracer.finishSpan(spanId);
    }
  } catch (error) {
    if (tracer && spanId) {
      tracer.setError(spanId, error instanceof Error ? error : String(error));
      tracer.finishSpan(spanId);
    }
    console.error("[DORateLimit] Update error:", error);
  }
}
