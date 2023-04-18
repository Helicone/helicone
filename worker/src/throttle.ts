import { Env } from ".";

interface ThrottleOptions {
    time_window: number;
    segment: string | undefined;
    quota: number;
    unit: "token" | "request" | "dollar";
}

function parsePolicy(input: string): ThrottleOptions {
  const regex = /^(\d+);w=(\d+);(?:u=(request|token|dollar);?)?(?:s=([\w-]+);?)?$/;

  const match = input.match(regex);
  if (!match) {
      throw new Error("Invalid rate limit string format");
  }

  const quota = parseInt(match[1], 10);
  const time_window = parseInt(match[2], 10);
  const unit = match[3] as "request" | "token" | "dollar" | undefined;
  const segment = match[4];

  return {
      quota,
      time_window,
      unit: unit || "request",
      segment,
  };
}


export const getThrottleOptions = (request: Request): ThrottleOptions | undefined => {
    const policy = request.headers.get("Helicone-RateLimit-Policy");
    if (policy) {
      return parsePolicy(policy);
    }
    return undefined;
}

async function getSegmentKeyValue(request: Request, segment: string | undefined, user: string | undefined): Promise<string> {
  if (segment === undefined) {
    return 'global';
  } else if (segment === 'user') {
    const heliconeUserIdHeader = "helicone-user-id";
    const userId = request.headers.get(heliconeUserIdHeader) || (
        request.body ? user : undefined
    );
    console.log("USER ID", userId, user)
    if (userId === undefined) {
        throw new Error('Missing user ID');
    }
    return `user=${userId}`;
} else {
    const propTag = "helicone-property-";
    const heliconeHeaders = Object.fromEntries(
      [...request.headers.entries()]
        .filter(([key, _]) => key.startsWith(propTag) && key.length > propTag.length)
        .map(([key, value]) => [key.substring(propTag.length), value])
    );
    const headerValue = heliconeHeaders[segment];
    if (headerValue === undefined) {
      throw new Error(`Missing "${segment}" header`);
    }
    return `${segment}=${headerValue}`;
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
    user: string | undefined,
): Promise<{ status: "ok" | "throttled" }> {
    const segment = throttleOptions.segment;
    const quota = throttleOptions.quota;
    const time_window = throttleOptions.time_window;

    const segmentKeyValue = await getSegmentKeyValue(request, segment, user);
    const kvKey = `throttle_${segmentKeyValue}_${hashedKey}`;
    const kv = await env.THROTTLE_KV.get(kvKey, "text");
    console.log("checkThrottle after get is ", kv)
    const timestamps = kv !== null ? JSON.parse(kv) : [];

    if (timestamps.length < quota) {
        return { status: "ok" };
    }

    // Check if the first timestamp is within the time window when the length is exactly equal to the quota
    if (timestamps.length === quota) {
        const now = Date.now();
        const timeWindowMillis = time_window * 1000; // Convert time_window to milliseconds
        if (now - timestamps[0] >= timeWindowMillis) {
            return { status: "ok" };
        } else {
            return { status: "throttled" };
        }
    }

    const now = Date.now();
    const firstRelevantIndex = binarySearchFirstRelevantIndex(timestamps, now, time_window * 1000);

    const relevantTimestampsCount = timestamps.length - firstRelevantIndex;

    if (relevantTimestampsCount >= quota) {
        return { status: "throttled" };
    }

    return { status: "ok" };
}


export async function updateThrottleCounter(
  request: Request,
  env: Env,
  throttleOptions: ThrottleOptions,
  hashedKey: string,
  user: string | undefined,
): Promise<void> {
  console.log("IN THE UPDATE THROTTLE COUNTER CODE")
  const segment = throttleOptions.segment;
  const time_window = throttleOptions.time_window;
  
  const segmentKeyValue = await getSegmentKeyValue(request, segment, user);
  const kvKey = `throttle_${segmentKeyValue}_${hashedKey}`;
  const kv = await env.THROTTLE_KV.get(kvKey, "text");
  console.log("updateCounter after get is ", kv)
  const timestamps = kv !== null ? JSON.parse(kv) : [];
  
  const now = Date.now();
  const timeWindowMillis = time_window * 1000; // Convert time_window to milliseconds
  const prunedTimestamps = timestamps.filter((timestamp: number) => {
    return now - timestamp < timeWindowMillis;
  });
  
  prunedTimestamps.push(now);
  
  await env.THROTTLE_KV.put(
    kvKey,
    JSON.stringify(prunedTimestamps),
    {
      expirationTtl: Math.ceil(timeWindowMillis / 1000), // Convert timeWindowMillis to seconds for expirationTtl
    }
  );

  console.log("updateCounter after put is ", await env.THROTTLE_KV.get(kvKey, "text"))
}
