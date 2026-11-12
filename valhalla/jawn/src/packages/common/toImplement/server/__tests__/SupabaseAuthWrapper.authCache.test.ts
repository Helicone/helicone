import { beforeEach, describe, expect, jest, test } from "@jest/globals";

/**
 * The auth cache lives in Redis shared by every Jawn task. During a deploy,
 * tasks running different code versions read each other's entries. These
 * tests pin down that the current code only trusts entries written under its
 * own versioned key and with a verified credential type, and that anything
 * else falls through to full verification.
 */

// Fake shared Redis. Lives outside the module registry so that a second,
// isolated copy of the module (another "task") sees the same store.
const mockRedisStore = new Map<string, string>();
const mockRedis = {
  get: jest.fn(async (key: string) => mockRedisStore.get(key) ?? null),
  set: jest.fn(async (key: string, value: unknown) => {
    mockRedisStore.set(key, String(value));
    return "OK";
  }),
};
jest.mock("../../../../../lib/clients/redisClient", () => ({
  redisClient: mockRedis,
}));

const mockAuthenticateBearer = jest.fn<(token: string) => Promise<any>>();
jest.mock("../common", () => ({
  authenticateBearer: (token: string) => mockAuthenticateBearer(token),
}));

jest.mock("../../../../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));

jest.mock("@helicone-package/secrets/SecretManager", () => ({
  SecretManager: {
    getSecret: (name: string) =>
      name === "SUPABASE_CREDS"
        ? JSON.stringify({
            url: "http://supabase.test",
            service_role_key: "test-service-role-key",
          })
        : undefined,
  },
}));

type QueryResult = { data: unknown; error: unknown };
function mockQuery(result: QueryResult) {
  const q: any = {
    select: () => q,
    eq: () => q,
    single: () => Promise.resolve(result),
    then: (resolve: any, reject: any) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return q;
}
const mockGetUser = jest.fn<(jwt: string) => Promise<any>>();
const mockFrom = jest.fn<(table: string) => any>();
jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: { getUser: (jwt: string) => mockGetUser(jwt) },
    from: (table: string) => mockFrom(table),
  }),
}));

import {
  AUTH_CACHE_VERSION,
  authCacheKey,
  isValidCachedAuth,
  orgCacheKey,
  SupabaseConnector,
} from "../SupabaseAuthWrapper";
import { hashAuth } from "../../../../../lib/db/hash";
import { stringToNumberHash } from "../../../../../utils/helpers";
import { HeliconeAuth } from "../../../auth/types";

const ORG = "11111111-1111-1111-1111-111111111111";
const OTHER_ORG = "22222222-2222-2222-2222-222222222222";
const USER = "33333333-3333-3333-3333-333333333333";

/** The key pre-versioning code (cacheResultCustom) used for auth entries. */
async function legacyAuthKey(
  authorization: HeliconeAuth,
  organizationId?: string
): Promise<string> {
  const middle = await hashAuth(JSON.stringify(authorization) + organizationId);
  return `cache:${stringToNumberHash(JSON.stringify([]) + middle)}`;
}

function legacyOrgKey(organizationId: string): string {
  return `cache:${stringToNumberHash(JSON.stringify([]) + `org:${organizationId}`)}`;
}

/** Writes a value the way KVCache does. */
function seedRedis(key: string, value: unknown) {
  mockRedisStore.set(key, JSON.stringify(value));
}

let tokenCounter = 0;
/** Unique token per test, so the per-process memory layer never interferes. */
function uniqueToken(prefix: string) {
  tokenCounter += 1;
  return `${prefix}-${Date.now()}-${tokenCounter}`;
}

function bearerVerified() {
  return {
    data: {
      organizationId: ORG,
      userId: USER,
      heliconeApiKeyId: 7,
      keyPermissions: "rw",
      tier: "pro",
      authType: "bearer",
    },
    error: null,
  };
}

function setupJwtMember() {
  mockGetUser.mockResolvedValue({ data: { user: { id: USER } }, error: null });
  mockFrom.mockImplementation((table: string) => {
    if (table === "organization_member") {
      return mockQuery({
        data: [{ organization: { id: ORG, tier: "pro" }, org_role: "admin" }],
        error: null,
      });
    }
    return mockQuery({ data: [], error: null });
  });
}

beforeEach(() => {
  mockRedisStore.clear();
  mockRedis.get.mockClear();
  mockRedis.set.mockClear();
  mockAuthenticateBearer.mockReset();
  mockGetUser.mockReset();
  mockFrom.mockReset();
});

async function flushCacheWrites() {
  await new Promise((resolve) => setImmediate(resolve));
}

describe("auth cache key", () => {
  test("is versioned and uses the full credential hash", async () => {
    const auth: HeliconeAuth = { _type: "bearer", token: "sk-helicone-abc" };
    const key = await authCacheKey(auth);
    expect(key.startsWith(`auth:v${AUTH_CACHE_VERSION}:cred:`)).toBe(true);
    expect(key).toMatch(/:[0-9a-f]{64}$/);
    expect(key).not.toBe(await legacyAuthKey(auth));
    expect(orgCacheKey(ORG)).toBe(`auth:v${AUTH_CACHE_VERSION}:org:${ORG}`);
  });

  test("different credentials and orgs get different keys", async () => {
    const a = await authCacheKey({ _type: "jwt", token: "t", orgId: ORG });
    const b = await authCacheKey({ _type: "jwt", token: "t", orgId: OTHER_ORG });
    const c = await authCacheKey({ _type: "bearer", token: "t" });
    expect(new Set([a, b, c]).size).toBe(3);
  });
});

describe("isValidCachedAuth", () => {
  test("accepts only successes with an org and a verified credential type", () => {
    expect(isValidCachedAuth(bearerVerified())).toBe(true);
    for (const authType of ["jwt", "bearer", "bearerProxy"]) {
      expect(
        isValidCachedAuth({ data: { organizationId: ORG, authType }, error: null })
      ).toBe(true);
    }
  });

  test("rejects entries without a verified credential type", () => {
    for (const value of [
      null,
      "string",
      { data: { organizationId: ORG }, error: null },
      { data: { organizationId: ORG, authType: undefined }, error: null },
      { data: { organizationId: ORG, authType: "admin" }, error: null },
      { data: { organizationId: ORG, authType: 1 }, error: null },
      { data: { organizationId: "", authType: "jwt" }, error: null },
      { data: { authType: "jwt" }, error: null },
      { data: null, error: "nope" },
      { data: { organizationId: ORG, authType: "jwt" }, error: "nope" },
    ]) {
      expect(isValidCachedAuth(value)).toBe(false);
    }
  });
});

describe("SupabaseConnector.authenticate cache", () => {
  test("ignores a pre-versioning entry (no authType) and re-verifies the API key", async () => {
    const auth: HeliconeAuth = { _type: "bearer", token: uniqueToken("sk") };
    const legacyKey = await legacyAuthKey({ ...auth });
    // What pre-versioning tasks wrote: no authType.
    seedRedis(legacyKey, {
      data: { organizationId: ORG, userId: USER, keyPermissions: "rw" },
      error: null,
    });
    mockAuthenticateBearer.mockResolvedValue(bearerVerified());

    const result = await new SupabaseConnector().authenticate(auth);

    expect(mockAuthenticateBearer).toHaveBeenCalledTimes(1);
    expect(result.error).toBeNull();
    expect(result.data?.authType).toBe("bearer");
    expect(result.data?.organizationId).toBe(ORG);
    expect(mockRedis.get.mock.calls.map((c) => c[0])).not.toContain(legacyKey);
  });

  test("a logged-in user is not rejected because of a pre-versioning JWT entry", async () => {
    // During a deploy cutover, an old task cached this user's JWT auth without
    // authType; the new task must re-verify instead of returning 401.
    const auth: HeliconeAuth = {
      _type: "jwt",
      token: uniqueToken("jwt"),
      orgId: ORG,
    };
    seedRedis(await legacyAuthKey({ ...auth }), {
      data: { organizationId: ORG, userId: USER, role: "admin", tier: "pro" },
      error: null,
    });
    setupJwtMember();

    const result = await new SupabaseConnector().authenticate(auth);

    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      organizationId: ORG,
      userId: USER,
      role: "admin",
      authType: "jwt",
    });
  });

  test("never lets a pre-versioning entry through when verification fails", async () => {
    const auth: HeliconeAuth = { _type: "bearer", token: uniqueToken("revoked") };
    seedRedis(await legacyAuthKey({ ...auth }), {
      data: { organizationId: OTHER_ORG, userId: USER, keyPermissions: "rw" },
      error: null,
    });
    mockAuthenticateBearer.mockResolvedValue({
      data: null,
      error: "No API key found",
    });

    const result = await new SupabaseConnector().authenticate(auth);

    expect(result.data).toBeNull();
    expect(result.error).toBe("No API key found");
    await flushCacheWrites();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  test("ignores a current-version entry that lacks a verified authType", async () => {
    for (const badData of [
      { organizationId: OTHER_ORG, userId: USER, keyPermissions: "rw" },
      { organizationId: OTHER_ORG, userId: USER, authType: "admin" },
    ]) {
      mockAuthenticateBearer.mockReset();
      const auth: HeliconeAuth = { _type: "bearer", token: uniqueToken("sk") };
      const key = await authCacheKey(auth);
      seedRedis(key, { data: badData, error: null });
      mockAuthenticateBearer.mockResolvedValue(bearerVerified());

      const result = await new SupabaseConnector().authenticate(auth);

      expect(mockAuthenticateBearer).toHaveBeenCalledTimes(1);
      expect(result.data?.organizationId).toBe(ORG);
      expect(result.data?.authType).toBe("bearer");
      await flushCacheWrites();
      // The bad entry was replaced by the freshly verified one.
      expect(JSON.parse(mockRedisStore.get(key)!)).toEqual(bearerVerified());
    }
  });

  test("new entries round-trip through shared Redis to another task", async () => {
    const auth: HeliconeAuth = { _type: "bearer", token: uniqueToken("sk") };
    mockAuthenticateBearer.mockResolvedValue(bearerVerified());

    const first = await new SupabaseConnector().authenticate({ ...auth });
    await flushCacheWrites();

    const key = await authCacheKey(auth);
    expect(mockRedisStore.has(key)).toBe(true);
    expect(mockAuthenticateBearer).toHaveBeenCalledTimes(1);

    // A fresh module copy has an empty in-process cache, like another task.
    let OtherTaskConnector!: typeof SupabaseConnector;
    jest.isolateModules(() => {
      OtherTaskConnector = require("../SupabaseAuthWrapper").SupabaseConnector;
    });
    expect(OtherTaskConnector).not.toBe(SupabaseConnector);
    const second = await new OtherTaskConnector().authenticate({ ...auth });

    expect(mockAuthenticateBearer).toHaveBeenCalledTimes(1);
    expect(mockRedis.get).toHaveBeenLastCalledWith(key);
    expect(second).toEqual(first);
    expect(second.data?.authType).toBe("bearer");
  });

  test("JWT entries round-trip with their authType", async () => {
    const auth: HeliconeAuth = {
      _type: "jwt",
      token: uniqueToken("jwt"),
      orgId: ORG,
    };
    setupJwtMember();
    const connector = new SupabaseConnector();

    const first = await connector.authenticate({ ...auth });
    await flushCacheWrites();
    const second = await connector.authenticate({ ...auth });

    expect(mockGetUser).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(second.data?.authType).toBe("jwt");
  });

  test("proxy keys are cached under the key computed before _type is rewritten", async () => {
    const auth: HeliconeAuth = {
      _type: "bearer",
      token: `sk-helicone-proxy-${uniqueToken("p")}-11111111-1111-1111-1111-111111111111`,
    };
    const key = await authCacheKey({ ...auth });
    mockFrom.mockImplementation(() =>
      mockQuery({
        data: { org_id: ORG, helicone_proxy_key: "hashed" },
        error: null,
      })
    );
    const connector = new SupabaseConnector();
    (connector.client as any).rpc = jest.fn(async () => ({
      data: true,
      error: null,
    }));

    const result = await connector.authenticate({ ...auth });
    await flushCacheWrites();

    expect(result.data?.authType).toBe("bearerProxy");
    expect(JSON.parse(mockRedisStore.get(key)!).data.authType).toBe(
      "bearerProxy"
    );
  });
});

describe("SupabaseConnector.getOrganization cache", () => {
  test("uses the versioned key and ignores pre-versioning entries", async () => {
    const orgId = `44444444-4444-4444-4444-${String(Date.now()).slice(-12).padStart(12, "0")}`;
    seedRedis(legacyOrgKey(orgId), {
      data: { id: orgId, tier: "enterprise" },
      error: null,
    });
    mockFrom.mockImplementation(() =>
      mockQuery({
        data: {
          id: orgId,
          tier: "free",
          percent_to_log: 100,
          has_onboarded: true,
          has_integrated: false,
        },
        error: null,
      })
    );

    const result = await new SupabaseConnector().getOrganization({
      organizationId: orgId,
      authType: "jwt",
    });
    await flushCacheWrites();

    expect(mockFrom).toHaveBeenCalledWith("organization");
    expect(result.data?.tier).toBe("free");
    expect(JSON.parse(mockRedisStore.get(orgCacheKey(orgId))!).data.tier).toBe(
      "free"
    );
  });
});
