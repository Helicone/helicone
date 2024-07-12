import { redisClient } from "../clients/redisClient";
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

type KVObject = {
  timestamp: number;
  unit: number;
}[];

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

function binarySearchFirstRelevantIndex(
  timestamps: number[],
  now: number,
  timeWindowMillis: number
): number {
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

interface RateLimitProps {
  heliconeProperties: HeliconeProperties;
  userId: string | undefined;
  rateLimitOptions: RateLimitOptions;
  providerAuthHash: string | undefined;
  cost: number;
}

export async function checkRateLimit(
  props: RateLimitProps
): Promise<RateLimitResponse> {
  const { heliconeProperties, userId, rateLimitOptions, providerAuthHash } =
    props;
  const { time_window, segment, quota } = rateLimitOptions;

  const segmentKeyValue = await getSegmentKeyValue(
    heliconeProperties,
    userId,
    segment
  );
  const kvKey = `rl_${segmentKeyValue}_${providerAuthHash}_3`;
  const kv = await redisClient?.get(kvKey);
  const timestamps: KVObject = kv ? JSON.parse(kv) : [];

  const now = Date.now();
  const timeWindowMillis = time_window * 1000; // Convert time_window to milliseconds

  const firstRelevantIndex = binarySearchFirstRelevantIndex(
    timestamps.map((x) => x.timestamp),
    now,
    timeWindowMillis
  );

  const relevantTimestamps = timestamps.slice(firstRelevantIndex);

  if (relevantTimestamps.length === 0) {
    return { status: "ok", limit: quota, remaining: quota };
  }
  const currentQuota = relevantTimestamps.reduce((acc, x) => acc + x.unit, 0);

  const remaining = Math.max(0, quota - currentQuota);

  const reset = Math.ceil(
    (timestamps[firstRelevantIndex].timestamp + timeWindowMillis - now) / 1000
  );

  if (currentQuota >= quota) {
    return { status: "rate_limited", limit: quota, remaining, reset };
  }

  return { status: "ok", limit: quota, remaining };
}

export async function updateRateLimitCounter(
  props: RateLimitProps
): Promise<void> {
  const {
    heliconeProperties,
    userId,
    rateLimitOptions,
    providerAuthHash: heliconeAuthHash,
  } = props;
  const { time_window, segment } = rateLimitOptions;

  const segmentKeyValue = await getSegmentKeyValue(
    heliconeProperties,
    userId,
    segment
  );

  const kvKey = `rl_${segmentKeyValue}_${heliconeAuthHash}_3`;
  const kv = await redisClient?.get(kvKey);
  const timestamps: KVObject = kv ? JSON.parse(kv) : [];

  const now = Date.now();
  const timeWindowMillis = time_window * 1000; // Convert time_window to milliseconds
  const prunedTimestamps = timestamps.filter((timestamp) => {
    return now - timestamp.timestamp < timeWindowMillis;
  });

  if (props.rateLimitOptions.unit === "request") {
    prunedTimestamps.push({
      timestamp: now,
      unit: 1,
    });
  } else if (props.rateLimitOptions.unit === "cents") {
    prunedTimestamps.push({
      timestamp: now,
      unit: props.cost * 100,
    });
  }

  await redisClient?.set(
    kvKey,
    JSON.stringify(prunedTimestamps),
    "EX",
    Math.ceil(timeWindowMillis / 1000)
  );
}
