import { createClient } from "@supabase/supabase-js";
import { Env, Result, hash } from "./index";
const MAX_CACHE_AGE = 60 * 60 * 24 * 365; // 365 days
const DEFAULT_CACHE_AGE = 60 * 60 * 24 * 7; // 7 days
const MAX_BUCKET_SIZE = 20;

export interface CacheSettings {
  shouldSaveToCache: boolean;
  shouldReadFromCache: boolean;
  cacheControl: string;
  bucketSettings: {
    maxSize: number;
  };
  ttl: number;
}

function buildCacheControl(cacheControl: string): [string, number] {
  const sMaxAge = cacheControl.match(/s-maxage=(\d+)/)?.[1];
  const maxAge = cacheControl.match(/max-age=(\d+)/)?.[1];

  if (sMaxAge || maxAge) {
    let sMaxAgeInSeconds = 0;
    try {
      sMaxAgeInSeconds = sMaxAge
        ? parseInt(sMaxAge)
        : maxAge
        ? parseInt(maxAge)
        : 0;
    } catch (e) {
      console.error("Error parsing s-maxage or max-age", e);
    }
    if (sMaxAgeInSeconds > MAX_CACHE_AGE) {
      return [`public, max-age=${MAX_CACHE_AGE}`, MAX_CACHE_AGE];
    }
    return [`public, max-age=${sMaxAgeInSeconds}`, sMaxAgeInSeconds];
  } else {
    return [`public, max-age=${DEFAULT_CACHE_AGE}`, DEFAULT_CACHE_AGE];
  }
}

interface CacheHeaders {
  cacheEnabled: boolean;
  cacheSave: boolean;
  cacheRead: boolean;
  cacheBucketMaxSize: number;
}

function getCacheState(headers: Headers): CacheHeaders {
  return {
    cacheEnabled:
      (headers.get("Helicone-Cache-Enabled") ?? "").toLowerCase() === "true",
    cacheSave:
      (headers.get("Helicone-Cache-Save") ?? "").toLowerCase() === "true",
    cacheRead:
      (headers.get("Helicone-Cache-Read") ?? "").toLowerCase() === "true",
    cacheBucketMaxSize: parseInt(
      headers.get("Helicone-Cache-Bucket-Max-Size") ?? "1"
    ),
  };
}

export function getCacheSettings(
  headers: Headers,
  isStream: boolean
): Result<CacheSettings, string> {
  // streams cannot be cached
  if (isStream) {
    return {
      data: {
        shouldReadFromCache: false,
        shouldSaveToCache: false,
        cacheControl: "no-cache",
        bucketSettings: {
          maxSize: 1,
        },
      },
      error: null,
    };
  }

  try {
    const cacheHeaders = getCacheState(headers);

    const shouldSaveToCache =
      cacheHeaders.cacheEnabled || cacheHeaders.cacheSave;
    const shouldReadFromCache =
      cacheHeaders.cacheEnabled || cacheHeaders.cacheRead;

    const [cacheControl, ttl] = buildCacheControl(
      headers.get("Cache-Control") ?? ""
    );
    if (cacheHeaders.cacheBucketMaxSize > MAX_BUCKET_SIZE) {
      return {
        error: `Cache bucket size cannot be greater than ${MAX_BUCKET_SIZE}`,
        data: null,
      };
    }

    return {
      error: null,
      data: {
        shouldReadFromCache,
        shouldSaveToCache,
        cacheControl,
        bucketSettings: {
          maxSize: cacheHeaders.cacheBucketMaxSize,
        },
        ttl,
      },
    };
  } catch (e) {
    return {
      error: JSON.stringify(e),
      data: null,
    };
  }
}

async function serializeResponse(response: Response): Promise<string> {
  const serializableResponse = {
    body: await response.json(), // Parse the body as JSON
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
  };

  return JSON.stringify(serializableResponse);
}

function deserializeResponse(serializedResponse: string): Response {
  const responseObj = JSON.parse(serializedResponse);

  const body = JSON.stringify(responseObj.body);

  return new Response(body, {
    status: responseObj.status,
    headers: responseObj.headers,
  });
}

async function buildCachedRequest(
  request: Request,
  idx: number
): Promise<string> {
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (key.toLowerCase().startsWith("helicone-auth")) {
      headers.set(key, value);
    }
    if (key.toLowerCase().startsWith("helicone-cache")) {
      headers.set(key, value);
    }
    if (key.toLowerCase() === "authorization") {
      headers.set(key, value);
    }
  }

  const cacheKey = await hash(
    request.url +
      (await request.text()) +
      JSON.stringify([...headers.entries()]) +
      (idx >= 1 ? idx.toString() : "")
  );
  const cacheUrl = new URL(request.url);

  const pathName = cacheUrl.pathname.replaceAll("/", "_");
  return `${pathName}_${cacheKey}`;
}


export async function saveToCache(
  request: Request,
  response: Response,
  cacheControl: string,
  settings: { maxSize: number },
  env: Env,
  ttl: number
): Promise<void> {
  console.log("Saving to cache");
  const responseClone = response.clone();
  const responseHeaders = new Headers(responseClone.headers);
  responseHeaders.set("Cache-Control", cacheControl);

  const { freeIndexes } = await getMaxCachedResponses(
    request.clone(),
    settings,
    env
  );
  if (freeIndexes.length > 0) {
    const cacheKey = await buildCachedRequest(request, freeIndexes[0]);
    const cacheResponse = new Response(responseClone.body, {
      ...responseClone,
      headers: responseHeaders,
    });

    await env.CACHE_KV.put(cacheKey, await serializeResponse(cacheResponse), {
      expirationTtl: Math.ceil(ttl),
    });
  } else {
    throw new Error("No free indexes");
  }
}

async function getMaxCachedResponses(
  request: Request,
  { maxSize }: { maxSize: number },
  env: Env
): Promise<{ requests: Response[]; freeIndexes: number[] }> {
  const requests = await Promise.all(
    Array.from(Array(maxSize).keys()).map(async (idx) => {
      const cacheKey = await buildCachedRequest(request.clone(), idx);
      const cacheResponse = await env.CACHE_KV.get(cacheKey);
      return cacheResponse !== null
        ? deserializeResponse(cacheResponse)
        : undefined;
    })
  );
  return {
    requests: requests.filter((r) => r !== undefined) as Response[],
    freeIndexes: requests
      .map((r, idx) => idx)
      .filter((idx) => requests[idx] === undefined),
  };
}

export async function getCachedResponse(
  request: Request,
  settings: { maxSize: number },
  env: Env
): Promise<Response | null> {
  const { requests: requestCaches, freeIndexes } = await getMaxCachedResponses(
    request.clone(),
    settings,
    env
  );
  if (freeIndexes.length === 0) {
    console.log("Returning cache hit");
    const cacheIdx = Math.floor(Math.random() * requestCaches.length);
    const randomCache = requestCaches[cacheIdx];
    const cachedResponseHeaders = new Headers(randomCache.headers);
    cachedResponseHeaders.append("Helicone-Cache", "HIT");
    cachedResponseHeaders.append(
      "Helicone-Cache-Bucket-Idx",
      cacheIdx.toString()
    );
    return new Response(randomCache.body, {
      ...randomCache,
      headers: cachedResponseHeaders,
    });
  } else {
    return null;
  }
}

export async function recordCacheHit(
  headers: Headers,
  env: Env
): Promise<void> {
  const requestId = headers.get("helicone-id");
  if (!requestId) {
    console.error("No request id found in cache hit");
    return;
  }
  const dbClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { error } = await dbClient
    .from("cache_hits")
    .insert({ request_id: requestId });
  if (error) {
    console.error(error);
  }
}
