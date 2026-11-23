import { describe, expect, it } from "vitest";
import {
  buildCacheControl,
  getCacheSettings,
} from "../../src/lib/util/cache/cacheSettings";

describe("cacheSettings", () => {
  describe("buildCacheControl", () => {
    it("should return default cache age (7 days) when no cacheControl is provided", () => {
      const result = buildCacheControl("");
      expect(result).toBe("public, max-age=604800");
    });

    it("should parse standard s-maxage correctly", () => {
      const result = buildCacheControl("s-maxage=3600");
      expect(result).toBe("public, max-age=3600");
    });

    it("should parse standard max-age correctly", () => {
      const result = buildCacheControl("max-age=1800");
      expect(result).toBe("public, max-age=1800");
    });

    it("should prioritize s-maxage over max-age when both are present", () => {
      const result = buildCacheControl("public, max-age=1800, s-maxage=3600");
      expect(result).toBe("public, max-age=3600");
    });

    it("should handle case-insensitive directives", () => {
      const result = buildCacheControl("PUBLIC, S-MAXAGE=7200");
      expect(result).toBe("public, max-age=7200");
    });

    it("should NOT match vendor or prefixed extensions as s-maxage (e.g. x-s-maxage)", () => {
      const result = buildCacheControl("x-s-maxage=120");
      // Since x-s-maxage is not s-maxage or max-age, it should fall back to default
      expect(result).toBe("public, max-age=604800");
    });

    it("should NOT match prefixed extensions as max-age (e.g. custom-max-age)", () => {
      const result = buildCacheControl("custom-max-age=300");
      expect(result).toBe("public, max-age=604800");
    });

    it("should correctly parse s-maxage in multi-directive header with vendor extensions", () => {
      const result = buildCacheControl("x-s-maxage=120, s-maxage=900, max-age=300");
      expect(result).toBe("public, max-age=900");
    });

    it("should cap cache age at MAX_CACHE_AGE (365 days)", () => {
      const overlyLongAge = 60 * 60 * 24 * 500; // 500 days
      const result = buildCacheControl(`s-maxage=${overlyLongAge}`);
      expect(result).toBe("public, max-age=31536000");
    });
  });

  describe("getCacheSettings", () => {
    it("should parse valid cache headers properly", () => {
      const headers = new Headers({
        "Helicone-Cache-Enabled": "true",
        "Helicone-Cache-Bucket-Max-Size": "5",
        "Helicone-Cache-Seed": "custom-seed-123",
        "Cache-Control": "s-maxage=1200",
      });

      const result = getCacheSettings(headers);
      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        shouldReadFromCache: true,
        shouldSaveToCache: true,
        cacheControl: "public, max-age=1200",
        bucketSettings: {
          bucketSize: 5,
        },
        cacheSeed: "custom-seed-123",
      });
    });

    it("should return an error if bucket size exceeds MAX_BUCKET_SIZE", () => {
      const headers = new Headers({
        "Helicone-Cache-Enabled": "true",
        "Helicone-Cache-Bucket-Max-Size": "25",
      });

      const result = getCacheSettings(headers);
      expect(result.data).toBeNull();
      expect(result.error).toContain("Cache bucket size cannot be greater than 20");
    });
  });
});
