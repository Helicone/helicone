import { Env } from ".";

interface ThrottleOptions {
    segment: string;
    threshold: number;
    quantity: number;
    period: string;
}

export const getThrottleOptions = (request: Request): ThrottleOptions | undefined => {
    const enabled = request.headers.get("Helicone-Throttle-Enabled") === "true";
    const segment = request.headers.get("Helicone-Throttle-Segment");
    const threshold = request.headers.get("Helicone-Throttle-Threshold");
    const quantity = request.headers.get("Helicone-Throttle-Quantity");
    const period = request.headers.get("Helicone-Throttle-Period");

    if (!enabled) {
        return undefined;
    }

    const throttleOptions: ThrottleOptions = {
        segment: segment!,
        threshold: parseInt(threshold!, 10),
        quantity: parseInt(quantity!, 10),
        period: period!,
    };

    return throttleOptions;
}

async function getSegmentKeyValue(request: Request, segment: string): Promise<string> {
    if (segment === 'global') {
      return 'global';
    } else {
      const propTag = "helicone-property-";
      const heliconeHeaders = Object.fromEntries(
        [...request.headers.entries()]
          .filter(([key, _]) => key.startsWith(propTag) && key.length > propTag.length)
          .map(([key, value]) => [key.substring(propTag.length), value])
      );
  
      return `${segment}=${heliconeHeaders[segment]}`;
    }
}

const getTimeWindowMillis = (period: string): number => {
    // Calculate the time window based on the period
    let timeWindowMillis = 0;
    if (period === "minute") {
        timeWindowMillis = 60 * 1000;
    } else if (period === "hour") {
        timeWindowMillis = 60 * 60 * 1000;
    } else if (period === "day") {
        timeWindowMillis = 24 * 60 * 60 * 1000;
    }

    return timeWindowMillis;
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

export async function checkThrottle(
    request: Request,
    env: Env,
    throttleOptions: ThrottleOptions,
    hashedKey: string,
): Promise<{ status: "ok" | "throttled" }> {
    const segment = throttleOptions.segment;
    const threshold = throttleOptions.threshold;
    const period = throttleOptions.period;
  
    const segmentKeyValue = await getSegmentKeyValue(request, segment);
    const kvKey = `throttle_${segmentKeyValue}_${hashedKey}`;
    const kv = await env.THROTTLE_KV.get(kvKey, "text");
    const timestamps = kv !== null ? JSON.parse(kv) : [];

    if (timestamps.length < threshold) {
        return { status: "ok" };
    }

    // Check if the first timestamp is within the time window when the length is exactly equal to the threshold
    if (timestamps.length === threshold) {
        const now = Date.now();
        const timeWindowMillis = getTimeWindowMillis(period);
        if (now - timestamps[0] >= timeWindowMillis) {
            return { status: "ok" };
        } else {
            return { status: "throttled" };
        }
    }


    // Calculate the time window based on the period
    let timeWindowMillis = getTimeWindowMillis(period);

    const now = Date.now();
    const firstRelevantIndex = binarySearchFirstRelevantIndex(timestamps, now, timeWindowMillis);

    const relevantTimestampsCount = timestamps.length - firstRelevantIndex;

    if (relevantTimestampsCount >= threshold) {
        return { status: "throttled" };
    }

    return { status: "ok" };
}

export async function updateThrottleCounter(
  request: Request,
  env: Env,
  throttleOptions: ThrottleOptions,
  hashedKey: string,
): Promise<void> {
  const segment = throttleOptions.segment;
  const period = throttleOptions.period;
  
  const kvKey = `throttle_${segment}_${hashedKey}`;
  const kv = await env.THROTTLE_KV.get(kvKey, "text");
  const timestamps = kv !== null ? JSON.parse(kv) : [];
  
  let timeWindowMillis = getTimeWindowMillis(period);
  
  const now = Date.now();
  const prunedTimestamps = timestamps.filter((timestamp: number) => {
    return now - timestamp < timeWindowMillis;
  });
  
  prunedTimestamps.push(now);
  
  await env.THROTTLE_KV.put(
    kvKey,
    JSON.stringify(prunedTimestamps),
    {
      expirationTtl: Math.ceil(timeWindowMillis),
    }
  );
}