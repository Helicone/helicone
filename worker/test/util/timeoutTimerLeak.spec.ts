import { afterEach, describe, expect, it, vi } from "vitest";
import { withTimeout } from "../../src/lib/util/helpers";
import { callProvider } from "../../src/lib/clients/ProviderClient";
import { getCachedResponse } from "../../src/lib/util/cache/cacheFunctions";

// src/index.ts pulls in Durable Objects that need the workerd runtime.
// The modules under test only use `hash` from it, so stub the module.
vi.mock("../../src", () => ({
  hash: vi.fn((input: string) => Promise.resolve(`hashed_${input}`)),
}));

describe("timeout timers are cleared once the work settles", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("withTimeout resolves without leaving a pending timer", async () => {
    vi.useFakeTimers();

    const result = await withTimeout(Promise.resolve("ok"), 60_000);

    expect(result).toBe("ok");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("withTimeout still rejects with the timeout error when it wins the race", async () => {
    vi.useFakeTimers();

    const assertion = expect(
      withTimeout(new Promise(() => {}), 1_000)
    ).rejects.toThrow("Request timed out");
    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("callProvider clears the 30-minute abort timer after fetch resolves", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("{}")))
    );

    const response = await callProvider({
      headers: new Headers(),
      method: "POST",
      apiBase: "https://api.openai.com",
      body: "{}",
      increaseTimeout: true,
      originalUrl: new URL("https://api.openai.com/v1/chat/completions"),
      extraHeaders: null,
      env: {} as Env,
    });

    expect(response.status).toBe(200);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("getCachedResponse clears the cache timeout after the lookup resolves", async () => {
    vi.useFakeTimers();

    const request = {
      url: "https://api.openai.com/v1/chat/completions",
      requestWrapper: {
        unsafeGetBodyText: vi.fn(() => Promise.resolve("{}")),
        getHeaders: vi.fn(() => new Headers()),
        heliconeHeaders: {
          cacheHeaders: { cacheIgnoreKeys: null },
        },
      },
    };
    const cacheKv = { get: vi.fn(() => Promise.resolve(null)) };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await getCachedResponse(
      request as any,
      { bucketSize: 1 },
      cacheKv as any,
      null
    );

    // bucket has a free index -> cache miss -> null
    expect(response).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});
