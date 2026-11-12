import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";

jest.mock("../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));
const mockCreateUser = jest.fn();
jest.mock("../../packages/common/auth/server/AuthClientFactory", () => ({
  getHeliconeAuthClient: () => ({ createUser: mockCreateUser }),
}));
jest.mock("../../lib/onboarding", () => ({
  setupDemoOrganizationRequests: jest.fn(),
}));
jest.mock("../../lib/experiment/tempKeys/tempAPIKey", () => ({
  generateTempHeliconeAPIKey: jest.fn(),
}));

import { dbExecute } from "../../lib/shared/db/dbExecute";
import { OrganizationManager } from "../organization/OrganizationManager";
import { AuthParams } from "../../packages/common/auth/types";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

const ORG = "11111111-1111-1111-1111-111111111111";
const OTHER_ORG = "22222222-2222-2222-2222-222222222222";
const OWNER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ADMIN = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ADMIN2 = "dddddddd-dddd-dddd-dddd-dddddddddddd";
const MEMBER = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const EXISTING_EMAIL_USER = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

let members: Record<string, string>;

function installDb() {
  members = {
    [OWNER]: "owner",
    [ADMIN]: "admin",
    [ADMIN2]: "admin",
    [MEMBER]: "member",
  };
  mockDbExecute.mockImplementation((async (sql: string, params: any[]) => {
    const q = sql.replace(/\s+/g, " ").trim();
    if (q.includes("organization_member.org_role") && q.includes("LEFT JOIN")) {
      const [orgId, userId] = params;
      if (orgId !== ORG) return { data: [], error: null };
      return {
        data: [{ owner: OWNER, org_role: members[userId] ?? null }],
        error: null,
      };
    }
    if (q.startsWith("SELECT id FROM auth.users WHERE email")) {
      return params[0] === "existing@example.com"
        ? { data: [{ id: EXISTING_EMAIL_USER }], error: null }
        : { data: [], error: null };
    }
    if (q.startsWith("INSERT INTO organization_member (organization, member)")) {
      members[params[1]] = "member";
      return { data: [{ member: params[1] }], error: null };
    }
    if (q.startsWith("UPDATE organization_member SET org_role = $1")) {
      const [role, memberId] = params;
      if (memberId === OWNER || !members[memberId]) {
        return { data: [], error: null };
      }
      members[memberId] = role;
      return { data: [{ member: memberId }], error: null };
    }
    if (q.startsWith("DELETE FROM organization_member")) {
      if (params[0] !== OWNER) delete members[params[0]];
      return { data: [], error: null };
    }
    if (q.startsWith("UPDATE organization SET soft_delete = true")) {
      return { data: [{ id: ORG }], error: null };
    }
    throw new Error(`Unexpected query: ${q}`);
  }) as any);
}

const jwt = (userId: string, organizationId = ORG): AuthParams => ({
  organizationId,
  userId,
  authType: "jwt",
  role: "owner", // cached role is ignored; the DB role is used
});

const apiKey = (userId: string): AuthParams => ({
  organizationId: ORG,
  userId,
  authType: "bearer",
  keyPermissions: "rw",
});

describe("OrganizationManager membership authorization", () => {
  const originalBetterAuth = process.env.NEXT_PUBLIC_BETTER_AUTH;

  beforeEach(() => {
    jest.clearAllMocks();
    installDb();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_BETTER_AUTH = originalBetterAuth;
  });

  describe("addMember", () => {
    test("an API key whose stored user is an admin cannot add members", async () => {
      const manager = new OrganizationManager(apiKey(ADMIN));
      const result = await manager.addMember(ORG, "existing@example.com");
      expect(result.error).toBeTruthy();
      expect(members[EXISTING_EMAIL_USER]).toBeUndefined();
    });

    test("a JWT admin cannot add members to a different organization", async () => {
      const manager = new OrganizationManager(jwt(ADMIN));
      const result = await manager.addMember(OTHER_ORG, "existing@example.com");
      expect(result.error).toBeTruthy();
      expect(members[EXISTING_EMAIL_USER]).toBeUndefined();
    });

    test("a JWT member cannot add members", async () => {
      const manager = new OrganizationManager(jwt(MEMBER));
      const result = await manager.addMember(ORG, "existing@example.com");
      expect(result.error).toBeTruthy();
    });

    test("a JWT admin adds an existing user as a plain member", async () => {
      const manager = new OrganizationManager(jwt(ADMIN));
      const result = await manager.addMember(ORG, "Existing@Example.com");
      expect(result.error).toBeNull();
      expect(members[EXISTING_EMAIL_USER]).toBe("member");
      // No credentials of any kind are returned.
      expect(Object.keys(result.data ?? {})).toEqual(["userId"]);
    });

    test("Better Auth mode never creates accounts or temporary passwords", async () => {
      process.env.NEXT_PUBLIC_BETTER_AUTH = "true";
      const manager = new OrganizationManager(jwt(ADMIN));
      const result = await manager.addMember(ORG, "new-person@example.com");
      expect(result.error).toMatch(/sign up first/);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });

  describe("updateMember", () => {
    test("only member and admin roles can be assigned", async () => {
      const manager = new OrganizationManager(jwt(OWNER));
      expect((await manager.updateMember(ORG, "owner", MEMBER)).error).toBeTruthy();
      expect((await manager.updateMember(ORG, "superuser", MEMBER)).error).toBeTruthy();
      expect(members[MEMBER]).toBe("member");
    });

    test("cannot target the organization owner", async () => {
      const manager = new OrganizationManager(jwt(ADMIN));
      const result = await manager.updateMember(ORG, "member", OWNER);
      expect(result.error).toBeTruthy();
      expect(members[OWNER]).toBe("owner");
    });

    test("cannot change your own role", async () => {
      const manager = new OrganizationManager(jwt(ADMIN));
      const result = await manager.updateMember(ORG, "member", ADMIN);
      expect(result.error).toBeTruthy();
      expect(members[ADMIN]).toBe("admin");
    });

    test("an admin cannot change another admin; the owner can", async () => {
      const asAdmin = new OrganizationManager(jwt(ADMIN));
      expect((await asAdmin.updateMember(ORG, "member", ADMIN2)).error).toBeTruthy();
      expect(members[ADMIN2]).toBe("admin");

      const asOwner = new OrganizationManager(jwt(OWNER));
      expect((await asOwner.updateMember(ORG, "member", ADMIN2)).error).toBeNull();
      expect(members[ADMIN2]).toBe("member");
    });

    test("an admin can promote a member", async () => {
      const manager = new OrganizationManager(jwt(ADMIN));
      expect((await manager.updateMember(ORG, "admin", MEMBER)).error).toBeNull();
      expect(members[MEMBER]).toBe("admin");
    });

    test("API keys and cross-org paths are rejected", async () => {
      expect(
        (await new OrganizationManager(apiKey(OWNER)).updateMember(ORG, "admin", MEMBER))
          .error
      ).toBeTruthy();
      expect(
        (await new OrganizationManager(jwt(OWNER)).updateMember(OTHER_ORG, "admin", MEMBER))
          .error
      ).toBeTruthy();
      expect(members[MEMBER]).toBe("member");
    });
  });

  describe("removeOrganizationMember", () => {
    test("the owner can never be removed", async () => {
      const manager = new OrganizationManager(jwt(ADMIN));
      expect((await manager.removeOrganizationMember(ORG, OWNER)).error).toBeTruthy();
      expect(members[OWNER]).toBe("owner");
    });

    test("an admin cannot remove another admin; the owner can", async () => {
      const asAdmin = new OrganizationManager(jwt(ADMIN));
      expect((await asAdmin.removeOrganizationMember(ORG, ADMIN2)).error).toBeTruthy();
      expect(members[ADMIN2]).toBe("admin");

      const asOwner = new OrganizationManager(jwt(OWNER));
      expect((await asOwner.removeOrganizationMember(ORG, ADMIN2)).error).toBeNull();
      expect(members[ADMIN2]).toBeUndefined();
    });

    test("a member can leave but cannot remove others", async () => {
      const manager = new OrganizationManager(jwt(MEMBER));
      expect((await manager.removeOrganizationMember(ORG, ADMIN)).error).toBeTruthy();
      expect((await manager.removeOrganizationMember(ORG, MEMBER)).error).toBeNull();
      expect(members[MEMBER]).toBeUndefined();
    });

    test("API keys cannot remove members", async () => {
      const manager = new OrganizationManager(apiKey(OWNER));
      expect((await manager.removeOrganizationMember(ORG, MEMBER)).error).toBeTruthy();
      expect(members[MEMBER]).toBe("member");
    });
  });

  describe("updateOwner and deleteOrganization", () => {
    test("only the owner can transfer ownership", async () => {
      const manager = new OrganizationManager(jwt(ADMIN));
      expect((await manager.updateOwner(ORG, ADMIN)).error).toBeTruthy();
    });

    test("delete is owner-only and requires a JWT", async () => {
      expect((await new OrganizationManager(jwt(ADMIN)).deleteOrganization()).error).toBeTruthy();
      expect(
        (await new OrganizationManager(apiKey(OWNER)).deleteOrganization()).error
      ).toBeTruthy();
      expect((await new OrganizationManager(jwt(OWNER)).deleteOrganization()).error).toBeNull();
    });
  });
});
