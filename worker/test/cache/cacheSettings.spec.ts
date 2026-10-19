import { describe, it, expect } from "vitest";
import { getCacheSettings } from "../../src/lib/util/cache/cacheSettings";

const DEFAULT_CACHE_AGE = 60 * 60 * 24 * 7; // 7 days, matches cacheSettings.ts

function cacheControlFrom(cacheControlHeader: string): string | undefined {
  const result = getCacheSettings(
    new Headers({
      "Cache-Control": cacheControlHeader,
      "Helicone-Cache-Enabled": "true",
    })
  );
  expect(result.error).toBeNull();
  return result.data?.cacheControl;
}

describe("getCacheSettings Cache-Control directive matching", () => {
  it("uses the real max-age when a vendor x-s-maxage prefix is also present", () => {
    expect(cacheControlFrom("x-s-maxage=3600, max-age=1800")).toBe(
      "public, max-age=1800"
    );
  });

  it("does not invent an s-maxage TTL from x-s-maxage alone", () => {
    const cacheControl = cacheControlFrom("x-s-maxage=3600");
    expect(cacheControl).not.toBe("public, max-age=3600");
    expect(cacheControl).toBe(`public, max-age=${DEFAULT_CACHE_AGE}`);
  });

  it("still honors a real s-maxage directive over max-age", () => {
    expect(cacheControlFrom("s-maxage=3600, max-age=1800")).toBe(
      "public, max-age=3600"
    );
  });

  it("still honors a standalone max-age directive", () => {
    expect(cacheControlFrom("max-age=1800")).toBe("public, max-age=1800");
  });
});
