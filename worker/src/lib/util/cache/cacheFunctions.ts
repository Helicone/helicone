import { createClient } from "@supabase/supabase-js";
import { hash } from "../../..";
import { HeliconeProxyRequest } from "../../models/HeliconeProxyRequest";
import {
  ClickhouseClientWrapper,
  RequestResponseRMT,
} from "../../db/ClickhouseWrapper";
import { Database } from "../../../../supabase/database.types";
import { safePut } from "../../safePut";
import { DBLoggable } from "../../dbLogger/DBLoggable";
const CACHE_BACKOFF_RETRIES = 5;

function isGoogleAuthHeader(value: string): boolean {
  if (typeof value !== "string") {
    return false;
  }

  return value.split(" ").some((part) => part.startsWith("ya29."));
}

function tryGetBodyAndRemoveKeys(text: string, ignoreKeys: string[]): string {
  try {
    const json = JSON.parse(text);
    for (const key of ignoreKeys) {
      delete json[key];
    }
    return JSON.stringify(json);
  } catch {
    return text;
  }
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
  const ignoreKeys =
    request.requestWrapper.heliconeHeaders.cacheHeaders.cacheIgnoreKeys ?? [];

  // TODO: change to use safelyGetBody
  const body = tryGetBodyAndRemoveKeys(
    await request.requestWrapper.unsafeGetBodyText(),
    ignoreKeys
  );

  return await hash(
    (cacheSeed ?? "") +
      request.url +
      body +
      JSON.stringify([...headers.entries()]) +
      (freeIndex >= 1 ? freeIndex.toString() : "")
  );
}

interface SaveToCacheOptions {
  request: HeliconeProxyRequest;
  response: Response;
  responseBody: string[];
  responseLatencyMs: number;
  cacheControl: string;
  settings: { bucketSize: number };
  cacheKv: KVNamespace;
  cacheSeed: string | null;
}

async function trySaveToCache(options: SaveToCacheOptions): Promise<boolean> {
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
          latency: options.responseLatencyMs,
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

async function saveToCacheBackoff(
  options: SaveToCacheOptions
): Promise<boolean> {
  for (let i = 0; i < CACHE_BACKOFF_RETRIES; i++) {
    const result = await trySaveToCache(options);
    if (result) return result;
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** i));
  }
  return false;
}

export async function saveToCache(
  options: SaveToCacheOptions
): Promise<boolean> {
  return await saveToCacheBackoff(options);
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
        latency: number;
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
      cachedResponseHeaders.append(
        "Helicone-Cache-Latency",
        randomCache.latency ? randomCache.latency.toString() : "0"
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
        latency: number;
        body: string[];
      }>(requestCache, { type: "json" });
    })
  );

  return {
    requests: previouslyCachedReqs.filter((r) => r !== null) as {
      headers: Record<string, string>;
      latency: number;
      body: string[];
    }[],
    freeIndexes: previouslyCachedReqs
      .map((_r, idx) => idx)
      .filter((idx) => previouslyCachedReqs[idx] === null),
  };
}
