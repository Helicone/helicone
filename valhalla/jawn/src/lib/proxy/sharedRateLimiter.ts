import { HeliconeProperties } from "./HeliconeProxyRequest";

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

export type KVObject = {
  timestamp: number;
  unit: number;
}[];

/**
 * Get segment key value for rate limiting
 * @param properties - Helicone properties
 * @param userId - User ID
 * @param segment - Segment name
 * @returns Segment key value
 */
export async function getSegmentKeyValue(
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

/**
 * Binary search to find the first relevant timestamp index
 * Handles edge cases properly:
 * - Empty array returns -1
 * - All timestamps expired returns -1
 * - All timestamps relevant returns 0
 * - Mixed case returns first relevant index
 * @param timestamps - Array of timestamps
 * @param now - Current time
 * @param timeWindowMillis - Time window in milliseconds
 * @returns Index of first relevant timestamp or -1 if none found
 */
export function binarySearchFirstRelevantIndex(
  timestamps: number[],
  now: number,
  timeWindowMillis: number
): number {
  // Handle edge cases
  if (timestamps.length === 0) {
    return -1;
  }

  // If all timestamps are expired, return -1
  if (now - timestamps[0] >= timeWindowMillis) {
    return -1;
  }

  // If all timestamps are relevant, return 0
  if (now - timestamps[timestamps.length - 1] < timeWindowMillis) {
    return 0;
  }

  let left = 0;
  let right = timestamps.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (now - timestamps[mid] < timeWindowMillis) {
      result = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  return result;
}

/**
 * Parse and validate timestamps from storage
 * @param storedValue - Raw value from storage
 * @returns Validated timestamps array
 */
export function parseTimestamps(storedValue: string | null): KVObject {
  if (!storedValue) {
    return [];
  }

  try {
    const timestamps = JSON.parse(storedValue);
    // Validate that timestamps is an array
    if (!Array.isArray(timestamps)) {
      console.warn("Invalid timestamps format, resetting to empty array");
      return [];
    }
    return timestamps;
  } catch (parseError) {
    console.warn("Failed to parse timestamps, resetting to empty array:", parseError);
    return [];
  }
}

/**
 * Generate cache key for rate limiting
 * @param segmentKeyValue - Segment key value
 * @param identifier - Organization ID or provider auth hash
 * @param version - Version suffix (default: 'v1')
 * @returns Cache key
 */
export function generateCacheKey(
  segmentKeyValue: string,
  identifier: string,
  version: string = 'v1'
): string {
  return `rl_${segmentKeyValue}_${identifier}_${version}`;
}

/**
 * Calculate rate limit status
 * @param timestamps - Array of timestamps
 * @param now - Current time
 * @param timeWindowMillis - Time window in milliseconds
 * @param quota - Rate limit quota
 * @returns Rate limit response
 */
export function calculateRateLimitStatus(
  timestamps: KVObject,
  now: number,
  timeWindowMillis: number,
  quota: number
): RateLimitResponse {
  const firstRelevantIndex = binarySearchFirstRelevantIndex(
    timestamps.map((x) => x.timestamp),
    now,
    timeWindowMillis
  );

  const relevantTimestamps = firstRelevantIndex >= 0 
    ? timestamps.slice(firstRelevantIndex)
    : [];

  if (relevantTimestamps.length === 0) {
    return { status: "ok", limit: quota, remaining: quota };
  }
  
  const currentQuota = relevantTimestamps.reduce((acc, x) => acc + x.unit, 0);
  const remaining = Math.max(0, quota - currentQuota);

  if (currentQuota >= quota) {
    const reset = firstRelevantIndex >= 0 
      ? Math.ceil((timestamps[firstRelevantIndex].timestamp + timeWindowMillis - now) / 1000)
      : 0;
    return { status: "rate_limited", limit: quota, remaining, reset };
  }

  return { status: "ok", limit: quota, remaining };
}

/**
 * Prepare timestamps for storage
 * @param timestamps - Current timestamps
 * @param now - Current time
 * @param timeWindowMillis - Time window in milliseconds
 * @param unit - Rate limit unit
 * @param cost - Request cost (for cents-based limiting)
 * @returns Prepared timestamps for storage
 */
export function prepareTimestampsForStorage(
  timestamps: KVObject,
  now: number,
  timeWindowMillis: number,
  unit: "request" | "cents",
  cost: number
): KVObject {
  // Filter out expired timestamps
  const prunedTimestamps = timestamps.filter((timestamp) => {
    return now - timestamp.timestamp < timeWindowMillis;
  });

  // Add new timestamp based on unit type
  if (unit === "request") {
    prunedTimestamps.push({
      timestamp: now,
      unit: 1,
    });
  } else if (unit === "cents") {
    prunedTimestamps.push({
      timestamp: now,
      unit: cost * 100,
    });
  }

  // Sort timestamps by timestamp to maintain order
  return prunedTimestamps.sort((a, b) => a.timestamp - b.timestamp);
} 