import { createClient } from "@supabase/supabase-js";
import { Env, hash } from "../../..";
import { HeliconeProxyRequest } from "../../models/HeliconeProxyRequest";
import { ClickhouseClientWrapper } from "../../db/ClickhouseWrapper";
import { Database } from "../../../../supabase/database.types";
const CACHE_BACKOFF_RETRIES = 5;
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
    if (!key.startsWith("ya29.") && key.toLowerCase() === "authorization") {
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

interface SaveToCacheOptions {
  request: HeliconeProxyRequest;
  response: Response;
  responseBody: string[];
  cacheControl: string;
  settings: { bucketSize: number };
  cacheKv: KVNamespace;
  cacheSeed: string | null;
}

async function trySaveToCache(options: SaveToCacheOptions) {
  try {
    const {
      request,
      response,
      responseBody,
      cacheControl,
      settings,
      cacheKv,
      cacheSeed,
    } = options;
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
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error saving to cache:", error);
    return false;
  }
}

async function saveToCacheBackoff(options: SaveToCacheOptions) {
  for (let i = 0; i < CACHE_BACKOFF_RETRIES; i++) {
    const result = await trySaveToCache(options);
    if (result) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
  }
}

export async function saveToCache(options: SaveToCacheOptions): Promise<void> {
  await saveToCacheBackoff(options);
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

  // const { error } = await dbClient
  //   .from("cache_hits")
  //   .insert({ request_id: requestId, organization_id: organizationId });

  // if (error) {
  //   console.error(error);
  // }

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

  if (organizationId !== "ba195205-9d19-42de-9317-b479c20ed6ae") {
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
}
export async function getCachedResponse(
  request: HeliconeProxyRequest,
  settings: { bucketSize: number },
  cacheKv: KVNamespace,
  cacheSeed: string | null
): Promise<Response | null> {
  const CACHE_TIMEOUT = 2000;

  try {
    const { requests: requestCaches, freeIndexes } = (await Promise.race([
      getMaxCachedResponses(request, settings, cacheKv, cacheSeed),
      new Promise((resolve, reject) =>
        setTimeout(() => reject(new Error("Cache timeout")), CACHE_TIMEOUT)
      ),
    ])) as {
      requests: {
        headers: Record<string, string>;
        body: string[];
      }[];
      freeIndexes: number[];
    };

    if (freeIndexes.length > 0) {
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

      const cachedStream = new ReadableStream({
        start(controller) {
          let index = 0;
          const encoder = new TextEncoder();
          function pushChunk() {
            if (index < randomCache.body.length) {
              const chunk = encoder.encode(randomCache.body[index]);
              controller.enqueue(chunk);
              index++;
              pushChunk();
            } else {
              controller.close();
            }
          }
          pushChunk();
        },

        cancel() {
          console.log("Stream canceled");
        },
      });

      return new Response(cachedStream, {
        headers: cachedResponseHeaders,
      });
    }
  } catch (error) {
    console.error("Error fetching cache:", error);
    return null;
  }
}

async function getMaxCachedResponses(
  request: HeliconeProxyRequest,
  { bucketSize: bucketSize }: { bucketSize: number },
  cacheKv: KVNamespace,
  cacheSeed: string | null
) {
  const previouslyCachedReqs = await Promise.all(
    Array.from(Array(bucketSize).keys()).map(async (idx) => {
      const requestCache = await kvKeyFromRequest(request, idx, cacheSeed);
      return cacheKv.get<{
        headers: Record<string, string>;
        body: string[];
      }>(requestCache, { type: "json" });
    })
  );

  return {
    requests: previouslyCachedReqs.filter((r) => r !== null) as {
      headers: Record<string, string>;
      body: string[];
    }[],
    freeIndexes: previouslyCachedReqs
      .map((_r, idx) => idx)
      .filter((idx) => previouslyCachedReqs[idx] === null),
  };
}
