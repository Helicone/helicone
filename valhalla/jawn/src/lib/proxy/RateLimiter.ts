import { redisClient } from "../clients/redisClient";
import { HeliconeProperties } from "./HeliconeProxyRequest";
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
  providerAuthHash: string | undefined;
  cost: number;
}

export type { RateLimitOptions, RateLimitResponse };

export async function checkRateLimit(
  props: RateLimitProps
): Promise<RateLimitResponse> {
  try {
    const { heliconeProperties, userId, rateLimitOptions, providerAuthHash } =
      props;
    const { time_window, segment, quota } = rateLimitOptions;

    if (!providerAuthHash) {
      throw new Error("Provider auth hash is required for rate limiting");
    }

    const segmentKeyValue = await getSegmentKeyValue(
      heliconeProperties,
      userId,
      segment
    );
    
    // Use consistent key format with version suffix for future compatibility
    const kvKey = generateCacheKey(segmentKeyValue, providerAuthHash);
    const kv = await redisClient?.get(kvKey);
    
    const timestamps = parseTimestamps(kv ?? null);
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
      providerAuthHash: heliconeAuthHash,
    } = props;
    const { time_window, segment } = rateLimitOptions;

    if (!heliconeAuthHash) {
      throw new Error("Provider auth hash is required for rate limiting");
    }

    const segmentKeyValue = await getSegmentKeyValue(
      heliconeProperties,
      userId,
      segment
    );

    // Use consistent key format with version suffix
    const kvKey = generateCacheKey(segmentKeyValue, heliconeAuthHash);
    const kv = await redisClient?.get(kvKey);
    
    const timestamps = parseTimestamps(kv ?? null);
    const now = Date.now();
    const timeWindowMillis = time_window * 1000; // Convert time_window to milliseconds

    const preparedTimestamps = prepareTimestampsForStorage(
      timestamps,
      now,
      timeWindowMillis,
      props.rateLimitOptions.unit,
      props.cost
    );

    await redisClient?.set(
      kvKey,
      JSON.stringify(preparedTimestamps),
      "EX",
      Math.ceil(timeWindowMillis / 1000)
    );
  } catch (error) {
    console.error("Rate limit counter update failed:", error);
    // Don't throw error to avoid breaking the request flow
  }
}
