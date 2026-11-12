import { describe, it, expect } from "vitest";
import { HeliconeHeaders } from "../../src/lib/models/HeliconeHeaders";

function parseCacheIgnoreKeys(headerValue?: string) {
  const headers = new Headers();
  if (headerValue !== undefined) {
    headers.set("Helicone-Cache-Ignore-Keys", headerValue);
  }
  return new HeliconeHeaders(headers).cacheHeaders.cacheIgnoreKeys;
}

describe("HeliconeHeaders cacheIgnoreKeys", () => {
  it("returns null when the header is not set", () => {
    expect(parseCacheIgnoreKeys()).toBeNull();
  });

  it("splits a comma-separated list into individual keys", () => {
    expect(parseCacheIgnoreKeys("request_id,timestamp")).toEqual([
      "request_id",
      "timestamp",
    ]);
  });

  it("splits the documented three-key example", () => {
    expect(parseCacheIgnoreKeys("request_id,timestamp,session_id")).toEqual([
      "request_id",
      "timestamp",
      "session_id",
    ]);
  });

  it("trims whitespace around each key", () => {
    expect(parseCacheIgnoreKeys("request_id, timestamp ")).toEqual([
      "request_id",
      "timestamp",
    ]);
  });

  it("drops empty entries from a trailing comma", () => {
    expect(parseCacheIgnoreKeys("request_id,")).toEqual(["request_id"]);
  });

  it("keeps a single key as a one-element array", () => {
    expect(parseCacheIgnoreKeys("prompt_cache_key")).toEqual([
      "prompt_cache_key",
    ]);
  });
});
