import { createClient } from "@supabase/supabase-js";
import { Env, hash } from "../..";
import { HeliconeProxyRequest } from "../HeliconeProxyRequest/mapper";

export async function saveToCache(
  request: HeliconeProxyRequest,
  response: Response,
  cacheControl: string,
  settings: { maxSize: number }
): Promise<void> {
  console.log("Saving to cache");
  const cache = caches.default;
  const responseClone = response.clone();
  const responseHeaders = new Headers(responseClone.headers);
  responseHeaders.set("Cache-Control", cacheControl);
  const cacheResponse = new Response(responseClone.body, {
    ...responseClone,
    headers: responseHeaders,
  });
  console.log("cache response", response.headers);
  const { freeIndexes } = await getMaxCachedResponses(request, settings);
  if (freeIndexes.length > 0) {
    cache.put(await buildCachedRequest(request, freeIndexes[0]), cacheResponse);
  } else {
    throw new Error("No free indexes");
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

async function buildCachedRequest(
  request: HeliconeProxyRequest,
  idx: number
): Promise<Request> {
  const headers = new Headers();
  for (const [key, value] of request.requestWrapper.getHeaders().entries()) {
    if (key.toLowerCase().startsWith("helicone-cache")) {
      headers.set(key, value);
    }
    if (key.toLowerCase() === "helicone-auth") {
      headers.set(key, value);
    }
    if (key.toLowerCase() === "authorization") {
      headers.set(key, value);
    }
  }

  const cacheKey = await hash(
    request.url +
      (await request.requestWrapper.getText()) +
      JSON.stringify([...headers.entries()]) +
      (idx >= 1 ? idx.toString() : "")
  );
  const cacheUrl = new URL(request.url);

  const pathName = cacheUrl.pathname.replaceAll("/", "_");
  cacheUrl.pathname = `/posts/${pathName}/${cacheKey}`;

  return new Request(cacheUrl, {
    method: "GET",
    headers: headers,
  });
}

async function getMaxCachedResponses(
  request: HeliconeProxyRequest,
  { maxSize }: { maxSize: number }
): Promise<{ requests: Response[]; freeIndexes: number[] }> {
  const cache = caches.default;
  const requests = await Promise.all(
    Array.from(Array(maxSize).keys()).map(async (idx) => {
      const requestCache = await buildCachedRequest(request, idx);
      return cache.match(requestCache);
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
  request: HeliconeProxyRequest,
  settings: { maxSize: number }
): Promise<Response | null> {
  const { requests: requestCaches, freeIndexes } = await getMaxCachedResponses(
    request,
    settings
  );
  if (freeIndexes.length > 0) {
    console.log("Max cache size reached, not caching");
    return null;
  } else {
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
  }
}
