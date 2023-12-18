import { createClient } from "@supabase/supabase-js";
import { Env, hash } from "../..";
import { HeliconeProxyRequest } from "../HeliconeProxyRequest/mapper";
import { ClickhouseClientWrapper } from "../../lib/db/clickhouse";

export async function kvKeyFromRequest(
  request: HeliconeProxyRequest,
  freeIndex: number
): Promise<string> {
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

  return await hash(
    request.url +
      (await request.requestWrapper.getText()) +
      JSON.stringify([...headers.entries()]) +
      (freeIndex >= 1 ? freeIndex.toString() : "")
  );
}

export async function saveToCache(
  request: HeliconeProxyRequest,
  response: Response,
  responseBody: string,
  cacheControl: string,
  settings: { maxSize: number },
  cacheKv: KVNamespace
): Promise<void> {
  console.log("Saving to cache");
  const expirationTtl = cacheControl.includes("max-age=")
    ? parseInt(cacheControl.split("max-age=")[1])
    : 0;
  const { freeIndexes } = await getMaxCachedResponses(
    request,
    settings,
    cacheKv
  );
  if (freeIndexes.length > 0) {
    await cacheKv.put(
      await kvKeyFromRequest(request, freeIndexes[0]),
      JSON.stringify({
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      }),
      {
        expirationTtl,
      }
    );
  } else {
    throw new Error("No free indexes");
  }
}

export async function recordCacheHit(
  headers: Headers,
  env: Env,
  clickhouseDb: ClickhouseClientWrapper
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
  // This is a hack get org_id from header
  const { data: org_id } = await dbClient
    .from("request")
    .select("helicone_org_id")
    .eq("id", requestId)
    .single();
  const organization_id = org_id?.helicone_org_id;
  const { error: clickhouseError } = await clickhouseDb.dbInsertClickhouse(
    "cache_hits",
    [
      {
        request_id: requestId,
        organization_id: organization_id,
        created_at: null,
      },
    ]
  );
  if (clickhouseError) {
    console.error(clickhouseError);
  }
}
export async function getCachedResponse(
  request: HeliconeProxyRequest,
  settings: { maxSize: number },
  cacheKv: KVNamespace
): Promise<Response | null> {
  const { requests: requestCaches, freeIndexes } = await getMaxCachedResponses(
    request,
    settings,
    cacheKv
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
      headers: cachedResponseHeaders,
    });
  }
}

async function getMaxCachedResponses(
  request: HeliconeProxyRequest,
  { maxSize }: { maxSize: number },
  cacheKv: KVNamespace
) {
  const requests = await Promise.all(
    Array.from(Array(maxSize).keys()).map(async (idx) => {
      const requestCache = await kvKeyFromRequest(request, idx);
      return cacheKv.get<{
        headers: Record<string, string>;
        body: string;
      }>(requestCache, { type: "json" });
    })
  );
  return {
    requests: requests.filter((r) => r !== null) as {
      headers: Record<string, string>;
      body: string;
    }[],
    freeIndexes: requests
      .map((r, idx) => idx)
      .filter((idx) => requests[idx] === null),
  };
}
