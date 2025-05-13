import { createClient } from "@supabase/supabase-js";
import { Env, hash } from "../../..";
import { HeliconeProxyRequest } from "../../models/HeliconeProxyRequest";
import { ClickhouseClientWrapper, RequestResponseRMT } from "../../db/ClickhouseWrapper";
import { Database } from "../../../../supabase/database.types";
import { safePut } from "../../safePut";
const CACHE_BACKOFF_RETRIES = 5;

function isGoogleAuthHeader(value: string): boolean {
  if (typeof value !== "string") {
    return false;
  }

  return value.split(" ").some((part) => part.startsWith("ya29."));
}

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
    if (key.toLowerCase() === "authorization" && !isGoogleAuthHeader(value)) {
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
      const result = await safePut({
        key: cacheKv,
        keyName: await kvKeyFromRequest(request, freeIndexes[0], cacheSeed),
        value: JSON.stringify({
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
        }),
        options: {
          expirationTtl,
        },
      });
      if (!result.success) {
        console.error("Error saving to cache:", result.error);
      }
      return result.success;
    } else {
      return false;
    }
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
  userId: string | null,
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

  let { data: rowContents, error: rowContentsError } = await clickhouseDb.dbQuery<RequestResponseRMT>(
    `
      SELECT *
      FROM request_response_rmt
      WHERE request_id = {val_0: UUID}
      ORDER BY updated_at DESC
      LIMIT 1
    `, // don't need to filter by organization_id or provider because we're using the request_id (?)
    [requestId, organizationId, provider]
  );

  if (rowContents?.length === 0) {
    console.error("No row contents found in cache hit", requestId);
    return;
  }

  const row = rowContents?.[0];
  if (organizationId !== "ba195205-9d19-42de-9317-b479c20ed6ae") {
    if (row) {
      const cacheHitStartTime = performance.now();

      const { error: clickhouseError } = await clickhouseDb.dbInsertClickhouse("request_response_rmt", [
        {
          ...row,
          response_created_at: new Date().toISOString().replace('Z', '').replace('T', ' '),
          latency: Math.round(performance.now() - cacheHitStartTime), // not a good way to calculate
          request_id: crypto.randomUUID(),
          user_id: userId ?? "",
          organization_id: organizationId,
          time_to_first_token: 0, // Cache hits have instant first token (lol no they dont???)
          country_code: countryCode ?? row.country_code ?? "",
          properties: {
            ...row.properties,
            "Original-Response-Latency": row.latency.toString(),
          },
          cache_reference_id: requestId,
          cache_enabled: true,
        }
      ]);
      if (clickhouseError) {
        console.error("Error inserting cache hit into Clickhouse:", clickhouseError);
      }
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
