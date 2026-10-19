/**
 * Integration tests for Jawn's caching and Redis client code.
 *
 * Requires a running Valkey (7.2+) or Redis instance with TLS for integration
 * sections. Set REDIS_HOST and NODE_EXTRA_CA_CERTS to enable.
 *
 * Uses the production redisClient singleton — no mocking. The CI workflow
 * sets NODE_EXTRA_CA_CERTS so Node trusts the self-signed cert and the
 * production `tls: {}` works as-is.
 */

import { randomBytes } from "crypto";

// Must be set before importing staticMemCache which reads it via SecretManager.
process.env.REQUEST_CACHE_KEY = randomBytes(32).toString("hex");

// --- Imports: uses the real production redisClient singleton (no mock) ---

import { redisClient } from "../../clients/redisClient";
import {
  InMemoryCache,
  encrypt,
  decrypt,
  storeInCache,
  getFromCache,
  getAndStoreInCache,
} from "../../cache/staticMemCache";
import { KVCache } from "../../cache/kvCache";
import {
  checkRateLimit,
  updateRateLimitCounter,
} from "../../proxy/RateLimiter";
import { ok, err } from "../../../packages/common/result";

const REDIS_HOST = process.env.REDIS_HOST;

if (!REDIS_HOST) {
  console.warn(
    "REDIS_HOST not set, skipping Valkey/Redis integration tests. " +
      "Set REDIS_HOST (and NODE_EXTRA_CA_CERTS for TLS) to enable them."
  );
}

/**
 * Type-safe accessor for the Redis client inside integration tests.
 * Throws a clear message if the client is unexpectedly null, rather than
 * emitting 18 cryptic "Cannot read properties of null" errors.
 */
function getClient(): NonNullable<typeof redisClient> {
  if (!redisClient)
    throw new Error("redisClient is null. is REDIS_HOST set?");
  return redisClient;
}

afterAll(async () => {
  if (redisClient) {
    // KEYS is O(n) and blocks the event loop — acceptable here because this runs
    // in an isolated CI container with a handful of test keys. Do NOT copy this
    // pattern into production code; use SCAN or explicit key tracking instead.
    const testKeys = await redisClient.keys("test:*");
    const rlKeys = await redisClient.keys("rl_*test*");
    const allKeys = [...testKeys, ...rlKeys];
    if (allKeys.length > 0) await redisClient.del(...allKeys);
    await redisClient.quit();
  }
});

describe("InMemoryCache (staticMemCache.ts)", () => {
  let cache: InMemoryCache;

  beforeEach(() => {
    cache = new InMemoryCache(5);
  });

  it("stores and retrieves a value", () => {
    cache.set("key1", { name: "test" }, 10_000);
    expect(cache.get("key1")).toEqual({ name: "test" });
  });

  it("returns null for a missing key", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("returns null and evicts after TTL expires", async () => {
    cache.set("short", "value", 50); // 50ms TTL
    expect(cache.get("short")).toBe("value");

    await new Promise((r) => setTimeout(r, 200)); // Wide margin to avoid CI flakiness
    expect(cache.get("short")).toBeNull();
  });

  it("evicts the oldest entry when maxEntries is exceeded", () => {
    // Fill to capacity (5)
    for (let i = 0; i < 5; i++) {
      cache.set(`k${i}`, i, 60_000);
    }
    expect(cache.get("k0")).toBe(0);
    expect(cache.get("k4")).toBe(4);

    cache.set("k5", 5, 60_000);
    expect(cache.get("k0")).toBeNull();
    expect(cache.get("k5")).toBe(5);
  });

  it("delete removes a key", () => {
    cache.set("del", "bye", 60_000);
    expect(cache.get("del")).toBe("bye");
    cache.delete("del");
    expect(cache.get("del")).toBeNull();
  });

  it("handles overwriting the same key", () => {
    cache.set("dup", "first", 60_000);
    cache.set("dup", "second", 60_000);
    expect(cache.get("dup")).toBe("second");
  });
});

describe("encrypt / decrypt (staticMemCache.ts)", () => {
  it("encrypts and decrypts a simple string", async () => {
    const plaintext = "hello world";
    const encrypted = await encrypt(plaintext);

    expect(encrypted).toHaveProperty("iv");
    expect(encrypted).toHaveProperty("content");
    expect(encrypted.iv).not.toBe(plaintext);
    expect(encrypted.content).not.toBe(plaintext);

    const decrypted = await decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("encrypts and decrypts a JSON payload", async () => {
    const payload = JSON.stringify({
      orgId: "org_123",
      apiKey: "sk-abc",
      nested: { features: ["cache", "ratelimit"] },
    });

    const encrypted = await encrypt(payload);
    const decrypted = await decrypt(encrypted);
    expect(decrypted).toBe(payload);
    expect(JSON.parse(decrypted)).toEqual(JSON.parse(payload));
  });

  it("produces different ciphertexts for the same input (random IV)", async () => {
    const text = "determinism check";
    const e1 = await encrypt(text);
    const e2 = await encrypt(text);

    // IVs and ciphertexts should differ
    expect(e1.iv).not.toBe(e2.iv);
    expect(e1.content).not.toBe(e2.content);

    // But both decrypt to the same value
    expect(await decrypt(e1)).toBe(text);
    expect(await decrypt(e2)).toBe(text);
  });

  it("fails to decrypt with corrupted ciphertext", async () => {
    const encrypted = await encrypt("secret");
    encrypted.content = "0000" + encrypted.content.slice(4);

    await expect(decrypt(encrypted)).rejects.toThrow();
  });
});

const describeIfRedis = REDIS_HOST ? describe : describe.skip;

describeIfRedis("KVCache (kvCache.ts) — production subsystem", () => {
  let kvCache: KVCache;
  const suffix = Math.random().toString(36).slice(2, 10);

  beforeEach(() => {
    kvCache = new KVCache(2000);
  });

  it("set and get: round-trips a JSON object through memory + Redis", async () => {
    const key = `test:kv:${suffix}:basic`;
    const value = { org: "helicone", count: 42, tags: ["a", "b"] };

    await kvCache.set(key, value);
    const result = await kvCache.get<typeof value>(key);

    expect(result).toEqual(value);
  });

  it("get returns null for a non-existent key", async () => {
    const result = await kvCache.get("test:kv:nonexistent:" + suffix);
    expect(result).toBeNull();
  });

  it("serves from memory on second get (no extra Redis call)", async () => {
    const key = `test:kv:${suffix}:memhit`;
    await kvCache.set(key, "memory-first");

    // Spy on the production singleton's get method
    const getSpy = jest.spyOn(getClient(), "get");

    // First get populates memory from Redis if needed
    const r1 = await kvCache.get(key);
    expect(r1).toBe("memory-first");

    const callsAfterFirst = getSpy.mock.calls.length;

    // Second get should come from memory — no additional Redis call
    const r2 = await kvCache.get(key);
    expect(r2).toBe("memory-first");
    expect(getSpy.mock.calls.length).toBe(callsAfterFirst);

    getSpy.mockRestore();
  });

  it("handles complex nested objects", async () => {
    const key = `test:kv:${suffix}:nested`;
    const complex = {
      users: [{ id: 1, name: "Alice" }],
      metadata: { version: 2, flags: { beta: true } },
    };

    await kvCache.set(key, complex);
    const result = await kvCache.get<typeof complex>(key);
    expect(result).toEqual(complex);
  });

  it("a fresh KVCache instance retrieves value from Redis (cold memory)", async () => {
    const key = `test:kv:${suffix}:cold`;
    await kvCache.set(key, "persisted-in-redis");

    // Create a brand-new KVCache instance (empty memory layer)
    const freshCache = new KVCache(5000);
    const result = await freshCache.get(key);
    expect(result).toBe("persisted-in-redis");
  });
});

describeIfRedis(
  "storeInCache / getFromCache / getAndStoreInCache — production encrypted cache subsystem",
  () => {
    const suffix = Math.random().toString(36).slice(2, 10);

    it("storeInCache + getFromCache: encrypts, stores, and retrieves a value", async () => {
      const key = `test:store:${suffix}:basic`;
      const value = "provider-key-abc123";

      await storeInCache(key, value, 60);
      const retrieved = await getFromCache(key);

      expect(retrieved).toBe(value);
    });

    it("getFromCache returns null for a key that was never stored", async () => {
      const result = await getFromCache(`test:store:${suffix}:missing`);
      expect(result).toBeNull();
    });

    it("storeInCache stores JSON and getFromCache returns the JSON string", async () => {
      const key = `test:store:${suffix}:json`;
      const jsonValue = JSON.stringify({ apiKey: "sk-test", orgId: "org_x" });

      await storeInCache(key, jsonValue, 60);
      const retrieved = await getFromCache(key);

      expect(retrieved).toBe(jsonValue);
      expect(JSON.parse(retrieved!)).toEqual({
        apiKey: "sk-test",
        orgId: "org_x",
      });
    });

    it("getAndStoreInCache: caches the result of a function on first call", async () => {
      const key = `test:gas:${suffix}:first`;
      let callCount = 0;

      const fn = async () => {
        callCount++;
        return ok({ name: "computed", n: 1 });
      };

      const result1 = await getAndStoreInCache(key, fn, 60);
      expect(result1.error).toBeNull();
      expect(result1.data).toEqual({ name: "computed", n: 1 });
      expect(callCount).toBe(1);

      // Second call should return cached, fn not called again
      const result2 = await getAndStoreInCache(key, fn, 60);
      expect(result2.error).toBeNull();
      expect(result2.data).toEqual({ name: "computed", n: 1 });
      expect(callCount).toBe(1); // still 1 — served from cache
    });

    it("getAndStoreInCache: does not cache errors", async () => {
      const key = `test:gas:${suffix}:err`;
      let callCount = 0;

      const fn = async () => {
        callCount++;
        return err<string, string>("something went wrong");
      };

      const result1 = await getAndStoreInCache<string, string>(key, fn, 60);
      expect(result1.error).toBe("something went wrong");
      expect(callCount).toBe(1);

      // Call again — fn should be invoked again since errors aren't cached
      const result2 = await getAndStoreInCache<string, string>(key, fn, 60);
      expect(result2.error).toBe("something went wrong");
      expect(callCount).toBe(2);
    });

    it("getAndStoreInCache: handles string values with _helicone_cached_string wrapper", async () => {
      const key = `test:gas:${suffix}:str`;
      const fn = async () => ok("just-a-string-value");

      const result1 = await getAndStoreInCache(key, fn, 60);
      expect(result1.data).toBe("just-a-string-value");

      // Retrieve from cache
      const result2 = await getAndStoreInCache(key, fn, 60);
      expect(result2.data).toBe("just-a-string-value");
    });
  }
);

describeIfRedis(
  "Proxy Rate Limiter (RateLimiter.ts) — production subsystem",
  () => {
    const suffix = Math.random().toString(36).slice(2, 10);
    const providerAuthHash = `test_hash_${suffix}`;

    it("checkRateLimit: returns ok with full remaining when no prior requests", async () => {
      const result = await checkRateLimit({
        heliconeProperties: {},
        userId: undefined,
        rateLimitOptions: {
          time_window: 60,
          segment: undefined,
          quota: 10,
          unit: "request",
        },
        providerAuthHash,
        cost: 0,
      });

      expect(result.status).toBe("ok");
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(10);
    });

    it("updateRateLimitCounter + checkRateLimit: tracks requests in sliding window", async () => {
      const hash = `test_sliding_${suffix}`;
      const opts = {
        heliconeProperties: {} as Record<string, string>,
        userId: undefined,
        rateLimitOptions: {
          time_window: 60,
          segment: undefined,
          quota: 5,
          unit: "request" as const,
        },
        providerAuthHash: hash,
        cost: 0,
      };

      // Record 3 requests
      await updateRateLimitCounter(opts);
      await updateRateLimitCounter(opts);
      await updateRateLimitCounter(opts);

      const result = await checkRateLimit(opts);
      expect(result.status).toBe("ok");
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(2);
    });

    it("updateRateLimitCounter + checkRateLimit: rate-limits when quota exceeded", async () => {
      const hash = `test_exceed_${suffix}`;
      const opts = {
        heliconeProperties: {} as Record<string, string>,
        userId: undefined,
        rateLimitOptions: {
          time_window: 60,
          segment: undefined,
          quota: 3,
          unit: "request" as const,
        },
        providerAuthHash: hash,
        cost: 0,
      };

      // Exceed quota
      await updateRateLimitCounter(opts);
      await updateRateLimitCounter(opts);
      await updateRateLimitCounter(opts);

      const result = await checkRateLimit(opts);
      expect(result.status).toBe("rate_limited");
      expect(result.remaining).toBe(0);
      expect(result.reset).toBeGreaterThan(0);
    });

    it("updateRateLimitCounter: tracks cost-based rate limiting", async () => {
      const hash = `test_cost_${suffix}`;
      const opts = {
        heliconeProperties: {} as Record<string, string>,
        userId: undefined,
        rateLimitOptions: {
          time_window: 60,
          segment: undefined,
          quota: 100, // 100 cents = $1
          unit: "cents" as const,
        },
        providerAuthHash: hash,
        cost: 0.50, // $0.50 = 50 cents per request
      };

      // Two requests at $0.50 each = 100 cents = at quota
      await updateRateLimitCounter(opts);
      await updateRateLimitCounter(opts);

      const result = await checkRateLimit(opts);
      expect(result.status).toBe("rate_limited");
      expect(result.remaining).toBe(0);
    });

    it("checkRateLimit: supports user segment", async () => {
      const hash = `test_segment_${suffix}`;
      const opts = {
        heliconeProperties: {} as Record<string, string>,
        userId: "user_123",
        rateLimitOptions: {
          time_window: 60,
          segment: "user",
          quota: 5,
          unit: "request" as const,
        },
        providerAuthHash: hash,
        cost: 0,
      };

      await updateRateLimitCounter(opts);

      const result = await checkRateLimit(opts);
      expect(result.status).toBe("ok");
      expect(result.remaining).toBe(4);

      // Different user should have independent quota
      const otherUserOpts = { ...opts, userId: "user_456" };
      const otherResult = await checkRateLimit(otherUserOpts);
      expect(otherResult.status).toBe("ok");
      expect(otherResult.remaining).toBe(5); // full quota — no requests from this user
    });
  }
);

describeIfRedis(
  "HTTP API Rate Limiter — Lua script commands (ratelimitter.ts pattern)",
  () => {
    const suffix = Math.random().toString(36).slice(2, 10);

    // Mirrors the rate-limit-redis Lua pattern used by ratelimitter.ts:
    // INCR a key, set PEXPIRE on first hit, return [current count, ttl]
    const RATE_LIMIT_LUA_SCRIPT = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('PEXPIRE', KEYS[1], ARGV[1])
      end
      local ttl = redis.call('PTTL', KEYS[1])
      return {current, ttl}
    `;

    it("SCRIPT LOAD + EVALSHA: loads and executes the rate-limit Lua script", async () => {
      const sha = (await getClient().script(
        "LOAD",
        RATE_LIMIT_LUA_SCRIPT
      )) as string;

      expect(sha).toMatch(/^[0-9a-f]{40}$/);

      const key = `test:rl:${suffix}:lua`;
      const windowMs = "5000"; // 5s window

      // First call: INCR to 1, PEXPIRE set
      const result1 = (await getClient().evalsha(sha, 1, key, windowMs)) as [
        number,
        number,
      ];

      expect(result1[0]).toBe(1); // count = 1
      expect(result1[1]).toBeGreaterThan(0); // TTL is positive
      expect(result1[1]).toBeLessThanOrEqual(5000);

      // Second call: INCR to 2, PEXPIRE not re-set
      const result2 = (await getClient().evalsha(sha, 1, key, windowMs)) as [
        number,
        number,
      ];

      expect(result2[0]).toBe(2); // count = 2
      expect(result2[1]).toBeGreaterThan(0);
    });

    it("EVALSHA with non-existent SHA returns NOSCRIPT error", async () => {
      const fakeSha = "0000000000000000000000000000000000000000";
      const key = `test:rl:${suffix}:noscript`;

      await expect(
        getClient().evalsha(fakeSha, 1, key, "1000")
      ).rejects.toThrow(/NOSCRIPT/);
    });

    it("PEXPIRE sets millisecond TTL on a key", async () => {
      const key = `test:rl:${suffix}:pexpire`;
      await getClient().set(key, "value");
      const result = await getClient().pexpire(key, 3000);
      expect(result).toBe(1); // 1 = success

      const pttl = await getClient().pttl(key);
      expect(pttl).toBeGreaterThan(0);
      expect(pttl).toBeLessThanOrEqual(3000);
    });

    it("INCR + PTTL: atomic increment with TTL inspection", async () => {
      const key = `test:rl:${suffix}:incr`;

      // Set initial value with TTL
      await getClient().set(key, "0", "PX", 5000);

      const val1 = await getClient().incr(key);
      expect(val1).toBe(1);

      const val2 = await getClient().incr(key);
      expect(val2).toBe(2);

      const pttl = await getClient().pttl(key);
      expect(pttl).toBeGreaterThan(0);
      expect(pttl).toBeLessThanOrEqual(5000);
    });
  }
);

describeIfRedis(
  "Usage Limit Cache — GET/SET EX commands (UsageLimitManager.ts pattern)",
  () => {
    const suffix = Math.random().toString(36).slice(2, 10);

    it("SET EX + GET: stores and retrieves a cached usage limit result", async () => {
      const key = `test:usage:${suffix}:basic`;
      const value = JSON.stringify({ count: 42, limit: 100, remaining: 58 });

      await getClient().set(key, value, "EX", 60);
      const retrieved = await getClient().get(key);

      expect(retrieved).toBe(value);
      expect(JSON.parse(retrieved!)).toEqual({
        count: 42,
        limit: 100,
        remaining: 58,
      });
    });

    it("SET EX respects TTL (key expires)", async () => {
      const key = `test:usage:${suffix}:ttl`;
      await getClient().set(key, "expires-soon", "EX", 1);

      const immediate = await getClient().get(key);
      expect(immediate).toBe("expires-soon");

      await new Promise((r) => setTimeout(r, 1500)); // Wide margin to avoid CI flakiness
      const expired = await getClient().get(key);
      expect(expired).toBeNull();
    });

    it("GET returns null for non-existent key (cache miss path)", async () => {
      const result = await getClient().get(
        `test:usage:${suffix}:nonexistent`
      );
      expect(result).toBeNull();
    });
  }
);

describeIfRedis(
  "RedisStore (rate-limit-redis) — production sendCommand interface smoke test",
  () => {
    /**
     * Exercises the exact sendCommand interface used by ratelimitter.ts:
     *   new RedisStore({ sendCommand: (...args) => redisClient.call(...args) })
     *
     * This is the highest-signal compatibility check because rate-limit-redis
     * uses SCRIPT LOAD + EVALSHA internally — the least trivially-compatible
     * Redis commands in the Valkey context.
     */
    it("RedisStore increment/decrement/resetKey work against Valkey", async () => {
      const { RedisStore } = require("rate-limit-redis");

      const store = new RedisStore({
        prefix: "test:rlstore:",
        // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
        sendCommand: (...args: string[]) => getClient().call(...args),
      });

      // init() is normally called by express-rate-limit; it sets windowMs
      store.init({ windowMs: 60_000 });

      const suffix = Math.random().toString(36).slice(2, 10);
      const testKey = `smoke_${suffix}`;

      // Simulate hitting the rate limiter — increment should return totalHits
      const incrResult = await store.increment(testKey);
      expect(incrResult).toHaveProperty("totalHits");
      expect(incrResult.totalHits).toBe(1);
      expect(incrResult).toHaveProperty("resetTime");

      // Second hit
      const incrResult2 = await store.increment(testKey);
      expect(incrResult2.totalHits).toBe(2);

      // Decrement (used when a request is allowed but later fails)
      await store.decrement(testKey);
      const afterDecr = await store.increment(testKey);
      expect(afterDecr.totalHits).toBe(2); // was 2, decremented to 1, incremented back to 2

      // Reset the key entirely
      await store.resetKey(testKey);
      const afterReset = await store.increment(testKey);
      expect(afterReset.totalHits).toBe(1); // back to 1 after reset
    });
  }
);
