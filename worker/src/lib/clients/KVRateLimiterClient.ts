import { HeliconeProperties } from "../models/HeliconeProxyRequest";
import { safePut } from "../safePut";
import {
  RateLimitOptions,
  RateLimitResponse,
  KVObject,
  getSegmentKeyValue,
  parseTimestamps,
  generateCacheKey,
  calculateRateLimitStatus,
  prepareTimestampsForStorage,
} from "./sharedRateLimiter";

interface RateLimitProps {
  heliconeProperties: HeliconeProperties;
  userId: string | undefined;
  rateLimitOptions: RateLimitOptions;
  organizationId: string | undefined;
  rateLimitKV: KVNamespace;
  cost: number;
}

export type { RateLimitOptions, RateLimitResponse };

export async function checkRateLimit(
  props: RateLimitProps
): Promise<RateLimitResponse> {
  try {
    const {
      heliconeProperties,
      userId,
      rateLimitOptions,
      organizationId,
      rateLimitKV,
    } = props;
    const { time_window, segment, quota } = rateLimitOptions;

    if (!organizationId) {
      throw new Error("Organization ID is required for rate limiting");
    }

    const segmentKeyValue = await getSegmentKeyValue(
      heliconeProperties,
      userId,
      segment
    );
    
    // Use consistent key format with version suffix for future compatibility
    const kvKey = generateCacheKey(segmentKeyValue, organizationId);
    const kv = await rateLimitKV.get(kvKey, "text");
    
    const timestamps = parseTimestamps(kv);
    const now = Date.now();
    const timeWindowMillis = time_window * 1000; // Convert time_window to milliseconds

    return calculateRateLimitStatus(timestamps, now, timeWindowMillis, quota);
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // On error, allow the request to proceed but log the error
    return { status: "ok", limit: 0, remaining: 0 };
  }
}

export async function updateRateLimitCounter(
  props: RateLimitProps
): Promise<void> {
  try {
    const {
      heliconeProperties,
      userId,
      rateLimitOptions,
      organizationId,
      rateLimitKV,
    } = props;
    const { time_window, segment } = rateLimitOptions;

    if (!organizationId) {
      throw new Error("Organization ID is required for rate limiting");
    }

    const segmentKeyValue = await getSegmentKeyValue(
      heliconeProperties,
      userId,
      segment
    );

    // Use consistent key format with version suffix
    const kvKey = generateCacheKey(segmentKeyValue, organizationId);
    const kv = await rateLimitKV.get(kvKey, "text");
    
    const timestamps = parseTimestamps(kv);
    const now = Date.now();
    const timeWindowMillis = time_window * 1000; // Convert time_window to milliseconds

    const preparedTimestamps = prepareTimestampsForStorage(
      timestamps,
      now,
      timeWindowMillis,
      props.rateLimitOptions.unit,
      props.cost
    );

    await safePut({
      key: rateLimitKV,
      keyName: kvKey,
      value: JSON.stringify(preparedTimestamps),
      options: {
        expirationTtl: Math.ceil(timeWindowMillis / 1000), // Convert timeWindowMillis to seconds for expirationTtl
      },
    });
  } catch (error) {
    console.error("Rate limit counter update failed:", error);
    // Don't throw error to avoid breaking the request flow
  }
}
