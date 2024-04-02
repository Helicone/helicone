import { createClient } from "@supabase/supabase-js";
import { Env, hash } from "../../..";
import { HeliconeProxyRequest } from "../../models/HeliconeProxyRequest";
import { ClickhouseClientWrapper } from "../../db/ClickhouseWrapper";
import { Database } from "../../../../supabase/database.types";

export async function kvKeyFromRequest(
  request: HeliconeProxyRequest,
  freeIndex: number,
  cacheSeed: string | null
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
    (cacheSeed ?? "") +
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
  cacheKv: KVNamespace,
  cacheSeed: string | null
): Promise<void> {
  console.log("Saving to cache");
  const expirationTtl = cacheControl.includes("max-age=")
    ? parseInt(cacheControl.split("max-age=")[1])
    : 0;
  const { freeIndexes } = await getMaxCachedResponses(
    request,
    settings,
    cacheKv,
    cacheSeed
  );
  if (freeIndexes.length > 0) {
    await cacheKv.put(
      await kvKeyFromRequest(request, freeIndexes[0], cacheSeed),
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
  clickhouseDb: ClickhouseClientWrapper,
  organizationId: string,
  provider: string,
  countryCode: string | null
): Promise<void> {
  const requestId = headers.get("helicone-id");
  if (!requestId) {
    console.error("No request id found in cache hit");
    return;
  }
  // Dual writing for now
  const dbClient = createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await dbClient
    .from("cache_hits")
    .insert({ request_id: requestId, organization_id: organizationId });

  if (error) {
    console.error(error);
  }

  const { data: response, error: responseError } = await dbClient
    .from("response")
    .select("*")
    .eq("request", requestId)
    .single();

  if (responseError) {
    console.error(responseError);
  }

  const model = (response?.body as { model: string })?.model ?? null;
  const promptTokens = response?.prompt_tokens ?? 0;
  const completionTokens = response?.completion_tokens ?? 0;
  const latency = response?.delay_ms ?? 0;

  const { error: clickhouseError } = await clickhouseDb.dbInsertClickhouse(
    "cache_hits",
    [
      {
        request_id: requestId,
        organization_id: organizationId,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        model: model ?? "",
        latency: latency,
        created_at: null,
        provider,
        country_code: countryCode,
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
  cacheKv: KVNamespace,
  cacheSeed: string | null
): Promise<Response | null> {
  const { requests: requestCaches, freeIndexes } = await getMaxCachedResponses(
    request,
    settings,
    cacheKv,
    cacheSeed
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
  cacheKv: KVNamespace,
  cacheSeed: string | null
) {
  const requests = await Promise.all(
    Array.from(Array(maxSize).keys()).map(async (idx) => {
      const requestCache = await kvKeyFromRequest(request, idx, cacheSeed);
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
