import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  callProviderWithRetry,
  parseRetryAfter,
} from "../../src/lib/clients/ProviderClient";

const RETRY_OPTS = {
  retries: 3,
  factor: 2,
  minTimeout: 10,
  maxTimeout: 100,
};

function makeCallProps() {
  return {
    headers: new Headers(),
    method: "POST",
    apiBase: "https://api.example.com",
    body: "{}",
    increaseTimeout: false,
    originalUrl: new URL("https://example.com/v1/chat/completions"),
    extraHeaders: null,
    env: {} as Env,
  };
}

function fakeFetch(
  responses: Array<{ status: number; headers?: Record<string, string> }>
) {
  let i = 0;
  return vi.fn(async () => {
    const r = responses[Math.min(i++, responses.length - 1)];
    return new Response(JSON.stringify({ ok: r.status < 400 }), {
      status: r.status,
      headers: { "content-type": "application/json", ...(r.headers ?? {}) },
    });
  });
}

describe("parseRetryAfter", () => {
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
    expect(parseRetryAfter("3600")).toBe(60_000);
  });

  it("parses HTTP-date form and returns the wait in ms", () => {
    const future = new Date(Date.now() + 30_000).toUTCString();
    const wait = parseRetryAfter(future);
    expect(wait).toBeDefined();
    expect(wait!).toBeGreaterThan(25_000);
    expect(wait!).toBeLessThan(35_000);
  });

  it("returns null for an HTTP-date that is already in the past", () => {
    const past = new Date(Date.now() - 60_000).toUTCString();
    expect(parseRetryAfter(past)).toBeNull();
  });

  it("returns null for malformed header values", () => {
    expect(parseRetryAfter("not-a-number")).toBeNull();
    expect(parseRetryAfter("-5")).toBeNull();
    expect(parseRetryAfter("1.5")).toBeNull();
  });
});

describe("callProviderWithRetry", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("honours Retry-After delta-seconds on a 429 and waits before retrying", async () => {
    globalThis.fetch = fakeFetch([
      { status: 429, headers: { "retry-after": "1" } },
      { status: 200 },
    ]);

    const start = Date.now();
    const res = await callProviderWithRetry(makeCallProps(), {
      ...RETRY_OPTS,
      // raise maxTimeout so the parsed Retry-After wait is not capped
      maxTimeout: 5_000,
    });
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    // Retry-After: 1 → ~1000ms wait (allow small jitter)
    expect(elapsed).toBeGreaterThanOrEqual(900);
  });

  it("does not sleep on 429 when Retry-After is missing", async () => {
    globalThis.fetch = fakeFetch([{ status: 429 }, { status: 200 }]);

    const start = Date.now();
    const res = await callProviderWithRetry(makeCallProps(), {
      ...RETRY_OPTS,
      minTimeout: 10,
    });
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    // exponential: 10*2 = 20ms ceiling; allow generous slack
    expect(elapsed).toBeLessThan(500);
  });

  it("does not retry on a successful response", async () => {
    globalThis.fetch = fakeFetch([{ status: 200 }]);

    const res = await callProviderWithRetry(makeCallProps(), RETRY_OPTS);

    expect(res.status).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("returns the last failed response when retries are exhausted", async () => {
    globalThis.fetch = fakeFetch([
      { status: 503, headers: { "retry-after": "0" } },
    ]);

    const res = await callProviderWithRetry(makeCallProps(), {
      ...RETRY_OPTS,
      retries: 2,
      minTimeout: 1,
    });

    // After exhausting retries the last response (still 503) is returned to
    // the caller; the function itself does not throw.
    expect(res.status).toBe(503);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("ignores Retry-After on 5xx responses", async () => {
    globalThis.fetch = fakeFetch([
      { status: 503, headers: { "retry-after": "5" } },
      { status: 200 },
    ]);

    const start = Date.now();
    const res = await callProviderWithRetry(makeCallProps(), {
      ...RETRY_OPTS,
      maxTimeout: 5_000,
      minTimeout: 10,
    });
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    // 5xx should not sleep for the Retry-After value, only the short
    // exponential backoff. Allow generous slack.
    expect(elapsed).toBeLessThan(500);
  });

  it("does not sleep on 429 when Retry-After is 0 or in the past", async () => {
    // retry-after: 0 -> sleep(0) -> no wait
    globalThis.fetch = fakeFetch([
      { status: 429, headers: { "retry-after": "0" } },
      { status: 200 },
    ]);

    const start = Date.now();
    const res = await callProviderWithRetry(makeCallProps(), {
      ...RETRY_OPTS,
      minTimeout: 10,
    });
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    // Only the short exponential backoff should apply.
    expect(elapsed).toBeLessThan(500);
  });
});
