import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../../shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));
jest.mock("../../../refetchKeys", () => ({
  setAPIKey: jest.fn(),
  setProviderKeys: jest.fn(),
}));
jest.mock("../../../clients/constant", () => ({
  GET_KEY: jest.fn(),
}));

import { dbExecute } from "../../../shared/db/dbExecute";
import {
  generateHeliconeAPIKey,
  TempHeliconeAPIKey,
  TEMP_KEY_SWEEP_AGE_MS,
} from "../tempAPIKey";
import { KeyManager } from "../../../../managers/apiKeys/KeyManager";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

const ORG = "11111111-1111-1111-1111-111111111111";
const OWNER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ACTOR = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function installDb() {
  mockDbExecute.mockImplementation((async (sql: string, params: any[]) => {
    const q = sql.replace(/\s+/g, " ").trim();
    if (q.startsWith("SELECT owner FROM organization")) {
      return { data: [{ owner: OWNER }], error: null };
    }
    if (q.startsWith("SELECT id FROM organization")) {
      return { data: [{ id: params[0] }], error: null };
    }
    if (q.startsWith("INSERT INTO helicone_api_keys")) {
      return { data: [{ id: 123 }], error: null };
    }
    if (q.startsWith("UPDATE helicone_api_keys SET soft_delete = true")) {
      return { data: [], error: null };
    }
    throw new Error(`Unexpected query: ${q}`);
  }) as any);
}

function insertedUserId(): unknown {
  const call = mockDbExecute.mock.calls.find(([sql]) =>
    (sql as string).includes("INSERT INTO helicone_api_keys")
  );
  return call ? (call[1] as unknown[])[1] : undefined;
}

describe("temporary Helicone API keys", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installDb();
  });

  test("a key made for an actor carries that actor", async () => {
    const result = await generateHeliconeAPIKey(ORG, {
      kind: "actor",
      userId: ACTOR,
    });
    expect(result.error).toBeNull();
    expect(insertedUserId()).toBe(ACTOR);
  });

  test("an empty actor id is rejected (no silent owner fallback)", async () => {
    const result = await generateHeliconeAPIKey(ORG, {
      kind: "actor",
      userId: "",
    });
    expect(result.error).toBeTruthy();
    expect(insertedUserId()).toBeUndefined();
  });

  test("server-internal keys carry the organization owner", async () => {
    const result = await generateHeliconeAPIKey(ORG, {
      kind: "server-internal",
    });
    expect(result.error).toBeNull();
    expect(insertedUserId()).toBe(OWNER);
  });

  test("createTempKey refuses a missing or empty user id", async () => {
    for (const userId of [undefined, "", "   "]) {
      const manager = new KeyManager({ organizationId: ORG, userId });
      expect((await manager.createTempKey()).error).toBeTruthy();
    }
    expect(insertedUserId()).toBeUndefined();
  });

  test("cleanup sweeps expired temp keys after the key is used", async () => {
    const key = new TempHeliconeAPIKey("sk-helicone-temp", "123");
    const before = Date.now();
    const value = await key.with(async (apiKey) => apiKey.length);
    expect(value).toBeGreaterThan(0);

    const sweep = mockDbExecute.mock.calls.find(([sql]) =>
      (sql as string).includes("UPDATE helicone_api_keys")
    );
    expect(sweep).toBeDefined();
    const cutoff = new Date((sweep![1] as string[])[0]).getTime();
    expect(cutoff).toBeLessThanOrEqual(before - TEMP_KEY_SWEEP_AGE_MS + 1000);
    await expect(key.with(async () => 1)).rejects.toThrow("Key already used");
  });

  test("cleanup runs even if the callback throws", async () => {
    const key = new TempHeliconeAPIKey("sk-helicone-temp", "123");
    await expect(
      key.with(async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
    expect(
      mockDbExecute.mock.calls.some(([sql]) =>
        (sql as string).includes("UPDATE helicone_api_keys")
      )
    ).toBe(true);
  });
});

describe("KeyManager.createNormalKey", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installDb();
  });

  test("rejects API-key callers and callers without a user", async () => {
    const asKey = new KeyManager({
      organizationId: ORG,
      userId: OWNER,
      authType: "bearer",
      keyPermissions: "rw",
    });
    expect((await asKey.createNormalKey("k", "rw")).error).toBe("Unauthorized");

    const noUser = new KeyManager({ organizationId: ORG, authType: "jwt" });
    expect((await noUser.createNormalKey("k", "rw")).error).toBe("Unauthorized");
    expect(insertedUserId()).toBeUndefined();
  });

  test("stamps the key with the signed-in user", async () => {
    const manager = new KeyManager({
      organizationId: ORG,
      userId: ACTOR,
      authType: "jwt",
      role: "admin",
    });
    const result = await manager.createNormalKey("k", "w");
    expect(result.error).toBeNull();
    expect(insertedUserId()).toBe(ACTOR);
  });
});
