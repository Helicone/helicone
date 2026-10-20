import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));
jest.mock("../../../lib/refetchKeys", () => ({
  setAPIKey: jest.fn(async () => undefined),
}));
jest.mock("../../../lib/clients/constant", () => ({
  GET_KEY: jest.fn(),
}));
jest.mock("../../../lib/experiment/tempKeys/tempAPIKey", () => ({
  generateTempHeliconeAPIKey: jest.fn(),
}));

import { dbExecute } from "../../../lib/shared/db/dbExecute";
import {
  buildHeliconeApiKey,
  GenerateHashController,
} from "../generateHashController";
import {
  clampDemoMaxTokens,
  DEMO_MAX_MESSAGES,
  DEMO_MAX_TOKENS,
  validateDemoPayload,
} from "../demoController";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;
const ORG = "11111111-1111-1111-1111-111111111111";
const ADMIN = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

function installDb(role: string | null) {
  mockDbExecute.mockImplementation((async (sql: string, params: any[]) => {
    const q = sql.replace(/\s+/g, " ").trim();
    if (q.includes("organization_member.org_role") && q.includes("LEFT JOIN")) {
      return { data: [{ owner: "someone-else", org_role: role }], error: null };
    }
    if (q.startsWith("select count(*) from helicone_api_keys")) {
      return { data: [{ count: 0 }], error: null };
    }
    if (q.startsWith("SELECT organization_type FROM organization")) {
      return { data: [{ organization_type: "user" }], error: null };
    }
    if (q.startsWith("INSERT INTO helicone_api_keys")) {
      return { data: [], error: null };
    }
    throw new Error(`Unexpected query: ${q}`);
  }) as any);
}

function inserts() {
  return mockDbExecute.mock.calls.filter(([sql]) =>
    (sql as string).includes("INSERT INTO helicone_api_keys")
  );
}

describe("POST /v1/key/generateHash", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("API-key callers cannot mint keys", async () => {
    installDb("admin");
    const controller = new GenerateHashController();
    const result = await controller.generateHash(
      { keyName: "k", permissions: "rw", governance: false },
      {
        authParams: {
          organizationId: ORG,
          userId: ADMIN,
          authType: "bearer",
          keyPermissions: "rw",
        },
      } as any
    );
    expect(result.success).toBeUndefined();
    expect(controller.getStatus()).toBe(403);
    expect(inserts()).toHaveLength(0);
  });

  test("JWT members cannot mint keys", async () => {
    installDb("member");
    const controller = new GenerateHashController();
    const result = await controller.generateHash(
      { keyName: "k", permissions: "w", governance: false },
      {
        authParams: { organizationId: ORG, userId: ADMIN, authType: "jwt" },
      } as any
    );
    expect(result.success).toBeUndefined();
    expect(inserts()).toHaveLength(0);
  });

  test("the key is generated server-side; a caller-supplied secret is ignored", async () => {
    installDb("admin");
    const controller = new GenerateHashController();
    const result = await controller.generateHash(
      {
        keyName: "k",
        permissions: "rw",
        governance: false,
        ...({ apiKey: "sk-helicone-chosen-by-caller" } as object),
      },
      {
        authParams: { organizationId: ORG, userId: ADMIN, authType: "jwt" },
      } as any
    );
    expect(result.success).toBe(true);
    expect(result.apiKey).toMatch(/^sk-helicone-/);
    expect(result.apiKey).not.toBe("sk-helicone-chosen-by-caller");
    const [, params] = inserts()[0];
    expect((params as unknown[])[1]).toBe(ADMIN);
    expect((params as unknown[])[4]).toBe("rw");
  });

  test("key prefixes follow permissions and options", () => {
    const base = {
      organizationType: "user",
      isEu: false,
      governance: false,
      enableRateLimit: false,
    };
    expect(buildHeliconeApiKey({ ...base, permissions: "rw" })).toMatch(
      /^sk-helicone-[a-z0-9-]+$/
    );
    expect(buildHeliconeApiKey({ ...base, permissions: "w" })).toMatch(
      /^pk-helicone-/
    );
    expect(
      buildHeliconeApiKey({
        ...base,
        permissions: "rw",
        organizationType: "customer",
        isEu: true,
        governance: true,
        enableRateLimit: true,
      })
    ).toMatch(/^sk-eu-cp-gov-rl-/);
    expect(buildHeliconeApiKey({ ...base, permissions: "rw" })).not.toBe(
      buildHeliconeApiKey({ ...base, permissions: "rw" })
    );
  });
});

describe("demo completion limits", () => {
  test("max_tokens is clamped", () => {
    expect(clampDemoMaxTokens(undefined)).toBe(1000);
    expect(clampDemoMaxTokens(1_000_000)).toBe(DEMO_MAX_TOKENS);
    expect(clampDemoMaxTokens(-5)).toBe(1);
    expect(clampDemoMaxTokens(Number.NaN)).toBe(1000);
  });

  test("message count and payload size are bounded", () => {
    expect(validateDemoPayload({ messages: [] })).not.toBeNull();
    expect(
      validateDemoPayload({
        messages: new Array(DEMO_MAX_MESSAGES + 1).fill({ role: "user", content: "x" }),
      })
    ).not.toBeNull();
    expect(
      validateDemoPayload({
        messages: [{ role: "user", content: "x".repeat(70 * 1024) }],
      })
    ).not.toBeNull();
    expect(
      validateDemoPayload({ messages: [{ role: "user", content: "hello" }] })
    ).toBeNull();
  });
});
