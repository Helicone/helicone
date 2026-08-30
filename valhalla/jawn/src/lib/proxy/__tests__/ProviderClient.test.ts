import { parseRetryAfter } from "../ProviderClient";

describe("parseRetryAfter", () => {
  // Frozen reference point so the HTTP-date cases are deterministic.
  const NOW = Date.UTC(2026, 4, 16, 12, 0, 0); // 2026-05-16T12:00:00Z

  it("returns null for missing or empty values", () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter(undefined)).toBeNull();
    expect(parseRetryAfter("")).toBeNull();
    expect(parseRetryAfter("   ")).toBeNull();
  });

  it("parses delta-seconds form into milliseconds", () => {
    expect(parseRetryAfter("0")).toBe(0);
    expect(parseRetryAfter("1")).toBe(1_000);
    expect(parseRetryAfter("30")).toBe(30_000);
  });

  it("trims surrounding whitespace before parsing seconds", () => {
    expect(parseRetryAfter("  5  ")).toBe(5_000);
  });

  it("caps very large delta-seconds at 60 seconds", () => {
    // 1 hour Retry-After should be clamped so a hostile provider cannot freeze
    // the proxy for an unbounded amount of time.
    expect(parseRetryAfter("3600")).toBe(60_000);
  });

  it("rejects non-numeric, non-date strings", () => {
    expect(parseRetryAfter("soon")).toBeNull();
    expect(parseRetryAfter("1.5")).toBeNull();
    expect(parseRetryAfter("-1")).toBeNull();
  });

  it("parses HTTP-date form into milliseconds from `now`", () => {
    const fiveSecondsFromNow = new Date(NOW + 5_000).toUTCString();
    expect(parseRetryAfter(fiveSecondsFromNow, NOW)).toBe(5_000);
  });

  it("returns null for HTTP-date values in the past", () => {
    const tenSecondsAgo = new Date(NOW - 10_000).toUTCString();
    expect(parseRetryAfter(tenSecondsAgo, NOW)).toBeNull();
  });

  it("caps HTTP-date values far in the future at 60 seconds", () => {
    const oneHourFromNow = new Date(NOW + 3_600_000).toUTCString();
    expect(parseRetryAfter(oneHourFromNow, NOW)).toBe(60_000);
  });
});
