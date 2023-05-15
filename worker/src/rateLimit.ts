import { createClient } from "@supabase/supabase-js";
import {
  Env,
  RequestSettings,
  getHeliconeHeaders,
  hash,
  logRequest,
  processAndLogRequestResponse,
} from ".";
import { extractPrompt } from "./prompt";

export interface RateLimitOptions {
  time_window: number;
  segment: string | undefined;
  quota: number;
  unit: "token" | "request" | "dollar";
  policy: string;
}

export interface RateLimitResponse {
  status: "ok" | "rate_limited";
  limit: number;
  remaining: number;
  reset?: number;
}

function parsePolicy(input: string): RateLimitOptions {
  const regex = /^(\d+);w=(\d+)(?:;u=(request|token|dollar))?(?:;s=([\w-]+))?$/;

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
    policy: input,
  };
}

export const getRateLimitOptions = (
  request: Request
): RateLimitOptions | undefined => {
  const policy = request.headers.get("Helicone-RateLimit-Policy");
  if (policy) {
    return parsePolicy(policy);
  }
  return undefined;
};

async function getSegmentKeyValue(
  request: Request,
  segment: string | undefined,
  user: string | undefined
): Promise<string> {
  if (segment === undefined) {
    return "global";
  } else if (segment === "user") {
    const heliconeUserIdHeader = "helicone-user-id";
    const userId =
      request.headers.get(heliconeUserIdHeader) ||
      (request.body ? user : undefined);
    if (userId === undefined) {
      throw new Error("Missing user ID");
    }
    return `user=${userId}`;
  } else {
    const propTag = "helicone-property-";
    const heliconeHeaders = Object.fromEntries(
      [...request.headers.entries()]
        .filter(
          ([key]) =>
            key.toLowerCase().startsWith(propTag.toLowerCase()) &&
            key.length > propTag.length
        )
        .map(([key, value]) => [key.substring(propTag.length), value])
    );
    const headerValue = heliconeHeaders[segment.toLowerCase()];
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

export async function checkRateLimit(
  request: Request,
  env: Env,
  rateLimitOptions: RateLimitOptions,
  hashedKey: string,
  user: string | undefined
): Promise<RateLimitResponse> {
  const segment = rateLimitOptions.segment;
  const quota = rateLimitOptions.quota;
  const time_window = rateLimitOptions.time_window;

  const segmentKeyValue = await getSegmentKeyValue(request, segment, user);
  const kvKey = `rl_${segmentKeyValue}_${hashedKey}`;
  const kv = await env.RATE_LIMIT_KV.get(kvKey, "text");
  const timestamps = kv !== null ? JSON.parse(kv) : [];

  const now = Date.now();
  const timeWindowMillis = time_window * 1000; // Convert time_window to milliseconds

  const firstRelevantIndex = binarySearchFirstRelevantIndex(
    timestamps,
    now,
    timeWindowMillis
  );
  const relevantTimestampsCount = timestamps.length - firstRelevantIndex;

  const remaining = Math.max(0, quota - relevantTimestampsCount);
  const reset = Math.ceil(
    (timestamps[firstRelevantIndex] + timeWindowMillis - now) / 1000
  );

  if (timestamps.length < quota) {
    return { status: "ok", limit: quota, remaining };
  }

  // Check if the first timestamp is within the time window when the length is exactly equal to the quota
  if (timestamps.length === quota) {
    if (now - timestamps[0] >= timeWindowMillis) {
      return { status: "ok", limit: quota, remaining };
    } else {
      return { status: "rate_limited", limit: quota, remaining, reset };
    }
  }

  if (relevantTimestampsCount >= quota) {
    return { status: "rate_limited", limit: quota, remaining, reset };
  }

  return { status: "ok", limit: quota, remaining };
}

export async function updateRateLimitCounter(
  request: Request,
  env: Env,
  rateLimitOptions: RateLimitOptions,
  hashedKey: string,
  user: string | undefined
): Promise<void> {
  const segment = rateLimitOptions.segment;
  const time_window = rateLimitOptions.time_window;

  const segmentKeyValue = await getSegmentKeyValue(request, segment, user);
  const kvKey = `rl_${segmentKeyValue}_${hashedKey}`;
  const kv = await env.RATE_LIMIT_KV.get(kvKey, "text");
  const timestamps = kv !== null ? JSON.parse(kv) : [];

  const now = Date.now();
  const timeWindowMillis = time_window * 1000; // Convert time_window to milliseconds
  const prunedTimestamps = timestamps.filter((timestamp: number) => {
    return now - timestamp < timeWindowMillis;
  });

  prunedTimestamps.push(now);

  await env.RATE_LIMIT_KV.put(kvKey, JSON.stringify(prunedTimestamps), {
    expirationTtl: Math.ceil(timeWindowMillis / 1000), // Convert timeWindowMillis to seconds for expirationTtl
  });
}

function generateRateLimitHeaders(
  rateLimitCheckResult: RateLimitResponse,
  rateLimitOptions: RateLimitOptions
): { [key: string]: string } {
  const policy = `${rateLimitOptions.quota};w=${rateLimitOptions.time_window};u=${rateLimitOptions.unit}`;
  const headers: { [key: string]: string } = {
    "Helicone-RateLimit-Limit": rateLimitCheckResult.limit.toString(),
    "Helicone-RateLimit-Remaining": rateLimitCheckResult.remaining.toString(),
    "Helicone-RateLimit-Policy": policy,
  };

  if (rateLimitCheckResult.reset !== undefined) {
    headers["Helicone-RateLimit-Reset"] = rateLimitCheckResult.reset.toString();
  }

  return headers;
}

interface RateLimitingResult {
  response: Response | null;
  additionalHeaders: { [key: string]: string };
}

export async function handleRateLimiting(
  requestSettings: RequestSettings,
  request: Request,
  requestBody: {
    stream?: boolean | undefined;
    user?: string | undefined;
  },
  env: Env,
  ctx: ExecutionContext,
  rateLimitOptions: RateLimitOptions,
  startTime: Date
): Promise<RateLimitingResult> {
  const auth = request.headers.get("Authorization");

  if (auth === null) {
    return {
      response: new Response("No authorization header found!", {
        status: 401,
      }),
      additionalHeaders: {},
    };
  }

  const hashedKey = await hash(auth);
  const rateLimitCheckResult = await checkRateLimit(
    request,
    env,
    rateLimitOptions,
    hashedKey,
    requestBody.user
  );

  const additionalHeaders = generateRateLimitHeaders(
    rateLimitCheckResult,
    rateLimitOptions
  );
  const message = `Rate limit reached with Helicone under policy ${rateLimitOptions.policy}. Please wait before making more requests.`;

  if (rateLimitCheckResult.status === "rate_limited") {
    const responseMessage = JSON.stringify({
      error: {
        message,
        type: "rate_limit_error",
        param: null,
        code: null,
      },
    });
    const rateLimitedResponse = new Response(responseMessage, {
      status: 429,
      headers: {
        "content-type": "application/json;charset=UTF-8",
        ...additionalHeaders,
      },
    });

    const generateResponseHandler = async (): Promise<[boolean, string]> => {
      return [false, responseMessage];
    };

    const result = await extractPrompt(request);
    if (result.data !== null) {
      const { body, prompt } = result.data;

      const stringToStream = (str: string) => {
        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(str));
            controller.close();
          },
        });

        return readableStream;
      };

      const myStream = stringToStream(responseMessage);

      const processedResponse = await processAndLogRequestResponse(
        myStream,
        generateResponseHandler,
        auth,
        request,
        rateLimitedResponse,
        requestSettings,
        body,
        env,
        ctx,
        startTime,
        prompt
      );

      return {
        response: processedResponse,
        additionalHeaders,
      };
    } else {
      return {
        response: new Response(result.error, { status: 400 }),
        additionalHeaders,
      };
    }
  }

  return {
    response: null,
    additionalHeaders,
  };
}
