import { env } from "cloudflare:test";
import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_CACHE_TTL_SECONDS,
  CACHE_KEY_PREFIXES,
  RESPONSE_CACHE_KEY_VERSION,
  VAULT_NEGATIVE_CACHE_TTL_SECONDS,
} from "../../src/lib/util/cache/cacheKeys";
import {
  getAndStoreInCache,
  storeInCache,
} from "../../src/lib/util/cache/secureCache";
import {
  getProviderKeyFromProxy,
  getProviderKeyFromProxyCache,
  ProxyKeyRow,
} from "../../src/lib/RequestWrapper";
import { DBWrapper } from "../../src/lib/db/DBWrapper";
import { InMemoryCache } from "../../src/lib/util/cache/inMemoryCache";

type Call = { table: string; method: string; args: unknown[] };

function fakeSupabase(
  tables: Record<string, { data: unknown; error: unknown }>,
  calls: Call[]
) {
  return {
    from(table: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const builder: any = {};
      for (const method of ["select", "eq", "is", "not", "in"]) {
        builder[method] = (...args: unknown[]) => {
          calls.push({ table, method, args });
          return builder;
        };
      }
      const result = () =>
        tables[table] ?? { data: null, error: { message: "not found" } };
      builder.single = () => Promise.resolve(result());
      builder.then = (resolve: (v: unknown) => unknown) => resolve(result());
      return builder;
    },
    rpc: () => Promise.resolve({ data: true, error: null }),
    auth: { getUser: () => Promise.resolve({ data: null, error: null }) },
  };
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const PROXY_KEY_ID = "0f0f0f0f-0f0f-4f0f-8f0f-0f0f0f0f0f0f";
const PROXY_AUTH = `Bearer sk-helicone-proxy-abcdefg-1234567-${PROXY_KEY_ID}`;

afterEach(() => {
  InMemoryCache.getInstance().clear();
  vi.restoreAllMocks();
});

describe("auth cache prefixes and TTLs", () => {
  it("uses bumped prefixes so pre-fix entries are abandoned on deploy", () => {
    expect(CACHE_KEY_PREFIXES).toEqual({
      authParams: "authParams4-",
      customerPortalKey: "getProxy-CP-v2-",
      proxyKey: "getProxyKey-v2-",
      rateLimitPolicies: "rateLimitOptions-v2-",
      organization: "org-v4-",
      providerKeys: "provider_keys_v2_",
      apiKeys: "api_keys_v2_",
    });
    expect(RESPONSE_CACHE_KEY_VERSION).toBe("v2");
  });

  it("caps auth / key / limit cache lifetime at 5 minutes", () => {
    expect(AUTH_CACHE_TTL_SECONDS).toBeLessThanOrEqual(300);
    expect(VAULT_NEGATIVE_CACHE_TTL_SECONDS).toBeGreaterThanOrEqual(60);
  });

  it("does not read pre-fix authParams3- entries", async () => {
    const auth = { _type: "bearer" as const, token: "Bearer sk-test" };
    const cacheKey = (await sha256Hex(JSON.stringify(auth))).substring(0, 32);
    await storeInCache(
      `authParams3-${cacheKey}`,
      JSON.stringify({
        organizationId: "stale-org",
        tier: "enterprise",
        accessDict: { cache: true },
        metaData: { allowNegativeBalance: false, creditLimit: 0 },
      }),
      env,
      600
    );

    const calls: Call[] = [];
    vi.mocked(createClient).mockReturnValueOnce(
      fakeSupabase(
        {
          helicone_api_keys: {
            data: { organization_id: "fresh-org", user_id: "u", id: 1 },
            error: null,
          },
          organization: {
            data: { id: "fresh-org", tier: "free" },
            error: null,
          },
        },
        calls
      ) as never
    );

    const db = new DBWrapper(
      { ...env, ENVIRONMENT: "production" } as Env,
      auth
    );
    const params = await db.getAuthParams();
    expect(params.error).toBeNull();
    expect(params.data?.organizationId).toBe("fresh-org");

    // soft-deleted organizations are filtered out
    expect(calls).toContainEqual({
      table: "organization",
      method: "eq",
      args: ["soft_delete", false],
    });
  });
});

describe("negative caching of vault lookups", () => {
  it("remembers definitive failures and retries transient ones", async () => {
    let calls = 0;
    const definitive = async () => {
      calls++;
      return { data: null, error: "Proxy key not verified" };
    };
    const opts = {
      ttl: 60,
      shouldCache: (e: string) => e === "Proxy key not verified",
    };
    const key = `neg-test-${crypto.randomUUID()}`;
    const first = await getAndStoreInCache<string, string>(
      key,
      env,
      definitive,
      300,
      true,
      opts
    );
    const second = await getAndStoreInCache<string, string>(
      key,
      env,
      definitive,
      300,
      true,
      opts
    );
    expect(first.error).toBe("Proxy key not verified");
    expect(second.error).toBe("Proxy key not verified");
    expect(calls).toBe(1);

    let transientCalls = 0;
    const transient = async () => {
      transientCalls++;
      return { data: null, error: "connection reset" };
    };
    const key2 = `neg-test-${crypto.randomUUID()}`;
    await getAndStoreInCache<string, string>(
      key2,
      env,
      transient,
      300,
      true,
      opts
    );
    await getAndStoreInCache<string, string>(
      key2,
      env,
      transient,
      300,
      true,
      opts
    );
    expect(transientCalls).toBe(2);
  });
});

describe("proxy key resolution", () => {
  it("only accepts a provider key from the proxy key's own organization", async () => {
    const calls: Call[] = [];
    const client = fakeSupabase(
      {
        helicone_proxy_keys: {
          data: {
            id: PROXY_KEY_ID,
            org_id: "org-1",
            provider_key_id: "pk-1",
            helicone_proxy_key: "hashed",
          },
          error: null,
        },
        helicone_proxy_key_limits: { data: [], error: null },
        decrypted_provider_keys_v2: {
          data: {
            id: "pk-1",
            decrypted_provider_key: "sk-provider",
            provider_name: "openai",
            config: null,
          },
          error: null,
        },
      },
      calls
    );

    const result = await getProviderKeyFromProxy(
      PROXY_AUTH,
      env,
      client as never
    );
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      providerKey: "sk-provider",
      organizationId: "org-1",
      providerKeyId: "pk-1",
      providerName: "openai",
      limits: [],
    });
    expect(calls).toContainEqual({
      table: "decrypted_provider_keys_v2",
      method: "eq",
      args: ["org_id", "org-1"],
    });
  });

  it("enforces proxy key limits on cache hits, not only on misses", async () => {
    const limits = [
      {
        id: "limit-1",
        helicone_proxy_key: PROXY_KEY_ID,
        timewindow_seconds: 60,
        count: 1,
        cost: null,
        currency: null,
        created_at: null,
      },
    ];
    const cachedRow: ProxyKeyRow = {
      providerKey: "sk-provider",
      proxyKeyId: PROXY_KEY_ID,
      organizationId: "org-1",
      providerKeyId: "pk-1",
      providerName: "openai",
      providerKeyConfig: null,
      limits: limits as never,
    };
    await storeInCache(
      `${CACHE_KEY_PREFIXES.proxyKey}${PROXY_AUTH}`,
      JSON.stringify(cachedRow),
      env,
      AUTH_CACHE_TTL_SECONDS
    );

    const limitsVerdictKey = (
      await sha256Hex(JSON.stringify(limits))
    ).substring(0, 32);
    const failingClient = {
      from: () => {
        throw new Error("cache hit must not query the database");
      },
    };

    await env.CACHE_KV.put(limitsVerdictKey, "false");
    const overLimit = await getProviderKeyFromProxyCache(
      PROXY_AUTH,
      env,
      failingClient as never
    );
    expect(overLimit.error).toBe("Limits are not valid");

    await env.CACHE_KV.put(limitsVerdictKey, "true");
    const withinLimit = await getProviderKeyFromProxyCache(
      PROXY_AUTH,
      env,
      failingClient as never
    );
    expect(withinLimit.error).toBeNull();
    expect(withinLimit.data?.providerName).toBe("openai");
  });

  it("ignores pre-fix getProxyKey- cache entries", async () => {
    const otherAuth = `Bearer sk-helicone-proxy-abcdefg-7654321-${PROXY_KEY_ID}`;
    await storeInCache(
      `getProxyKey-${otherAuth}`,
      JSON.stringify({
        providerKey: "sk-stale",
        proxyKeyId: PROXY_KEY_ID,
        organizationId: "org-1",
      }),
      env,
      600
    );
    const client = fakeSupabase({}, []);
    const result = await getProviderKeyFromProxyCache(
      otherAuth,
      env,
      client as never
    );
    expect(result.data).toBeNull();
    expect(result.error).toBe("Proxy key not found in storedProxyKey");
  });
});
