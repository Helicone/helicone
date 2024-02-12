import { Headers } from "@cloudflare/workers-types";
import { Result } from "../../results";

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
  cacheSeed: string | null;
}

function buildCacheControl(cacheControl: string): string {
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
      return `public, max-age=${MAX_CACHE_AGE}`;
    }
    return `public, max-age=${sMaxAgeInSeconds}`;
  } else {
    return `public, max-age=${DEFAULT_CACHE_AGE}`;
  }
}

interface CacheHeaders {
  cacheEnabled: boolean;
  cacheSave: boolean;
  cacheRead: boolean;
  cacheBucketMaxSize: number;
  cacheSeed: string | null;
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
    cacheSeed: headers.get("Helicone-Cache-Seed"),
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
        cacheSeed: null,
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

    const cacheControl = buildCacheControl(headers.get("Cache-Control") ?? "");
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
        cacheSeed: cacheHeaders.cacheSeed,
      },
    };
  } catch (e) {
    return {
      error: JSON.stringify(e),
      data: null,
    };
  }
}
