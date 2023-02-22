import { Result } from "./index";

export interface CacheSettings {
  shouldSaveToCache: boolean;
  shouldReadFromCache: boolean;
  cacheControl: string;
}

function buildCacheControl(cacheControl: string): string {
  const sMaxAge = cacheControl.match(/s-maxage=(\d+)/)?.[1];
  const maxAge = cacheControl.match(/max-age=(\d+)/)?.[1];
  if (sMaxAge || maxAge) {
    return `public, max-age=${sMaxAge ?? maxAge}`;
  } else {
    return "public, max-age=0";
  }
}

interface CacheHeaders {
  cacheEnabled: boolean;
  cacheSaveOnly: boolean;
  cacheReadOnly: boolean;
}

function getCacheState(headers: Headers): CacheHeaders {
  return {
    cacheEnabled:
      (headers.get("Helicone-Cache-Enabled") ?? "").toLowerCase() === "true",
    cacheSaveOnly:
      (headers.get("Helicone-Cache-Save-Only") ?? "").toLowerCase() === "true",
    cacheReadOnly:
      (headers.get("Helicone-Cache-Read-Only") ?? "").toLowerCase() === "true",
  };
}

export function getCacheSettings(
  headers: Headers
): Result<CacheSettings, string> {
  const cacheHeaders = getCacheState(headers);

  if (cacheHeaders.cacheSaveOnly && cacheHeaders.cacheReadOnly) {
    return {
      error:
        "Helicone-Cache-Save-Only and Helicone-Cache-Read-Only cannot both be true. Instead, only set Helicone-Cache-Enabled to true.",
      data: null,
    };
  }
  const shouldSaveToCache =
    (cacheHeaders.cacheEnabled && !cacheHeaders.cacheReadOnly) ||
    cacheHeaders.cacheSaveOnly;
  const shouldReadFromCache =
    (cacheHeaders.cacheEnabled && !cacheHeaders.cacheSaveOnly) ||
    cacheHeaders.cacheReadOnly;

  const cacheControl = buildCacheControl(headers.get("Cache-Control") ?? "");

  return {
    error: null,
    data: {
      shouldReadFromCache,
      shouldSaveToCache,
      cacheControl,
    },
  };
}
