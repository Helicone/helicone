import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));

import { dbExecute } from "../../lib/shared/db/dbExecute";
import { AuthParams } from "../../packages/common/auth/types";
import {
  authorizeOrgActor,
  getVerifiedOrgRole,
  isAssignableMemberRole,
  isPermissionSubset,
  ORG_ADMIN_ROLES,
  ORG_OWNER_ROLES,
} from "../orgAuthz";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

const ORG = "11111111-1111-1111-1111-111111111111";
const OTHER_ORG = "22222222-2222-2222-2222-222222222222";
const OWNER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ADMIN = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const MEMBER = "cccccccc-cccc-cccc-cccc-cccccccccccc";

// organization id -> { owner, members: userId -> role }
const orgs: Record<string, { owner: string; members: Record<string, string> }> =
  {
    [ORG]: {
      owner: OWNER,
      members: { [OWNER]: "owner", [ADMIN]: "admin", [MEMBER]: "member" },
    },
  };

function installDb() {
  mockDbExecute.mockImplementation((async (sql: string, params: any[]) => {
    if (sql.includes("FROM organization") && sql.includes("organization_member.org_role")) {
      const [orgId, userId] = params;
      const org = orgs[orgId];
      if (!org) return { data: [], error: null };
      return {
        data: [{ owner: org.owner, org_role: org.members[userId] ?? null }],
        error: null,
      };
    }
    throw new Error(`Unexpected query: ${sql}`);
  }) as any);
}

const jwt = (userId: string, organizationId = ORG): AuthParams => ({
  organizationId,
  userId,
  authType: "jwt",
  // The cached role is deliberately wrong to prove the DB is re-checked.
  role: "owner",
});

describe("getVerifiedOrgRole", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installDb();
  });

  test("organization.owner is the canonical owner", async () => {
    expect((await getVerifiedOrgRole(ORG, OWNER)).data?.role).toBe("owner");
    expect((await getVerifiedOrgRole(ORG, ADMIN)).data?.role).toBe("admin");
    expect((await getVerifiedOrgRole(ORG, MEMBER)).data?.role).toBe("member");
  });

  test("non-members and unknown orgs have no role", async () => {
    expect((await getVerifiedOrgRole(ORG, "nobody")).data).toBeNull();
    expect((await getVerifiedOrgRole(OTHER_ORG, OWNER)).data).toBeNull();
  });
});

describe("authorizeOrgActor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installDb();
  });

  test("allows a JWT admin acting on the authenticated org", async () => {
    const result = await authorizeOrgActor(jwt(ADMIN), ORG_ADMIN_ROLES, ORG);
    expect(result.error).toBeNull();
    expect(result.data?.role).toBe("admin");
    expect(result.data?.ownerId).toBe(OWNER);
  });

  test("rejects Helicone API keys even when their stored user is an admin", async () => {
    const result = await authorizeOrgActor(
      { organizationId: ORG, userId: ADMIN, authType: "bearer", keyPermissions: "rw" },
      ORG_ADMIN_ROLES,
      ORG
    );
    expect(result.error?.status).toBe(403);
    expect(mockDbExecute).not.toHaveBeenCalled();
  });

  test("rejects proxy keys and callers with no verified type", async () => {
    expect(
      (
        await authorizeOrgActor(
          { organizationId: ORG, authType: "bearerProxy" },
          ORG_ADMIN_ROLES
        )
      ).error?.status
    ).toBe(403);
    expect(
      (await authorizeOrgActor({ organizationId: ORG, userId: ADMIN }, ORG_ADMIN_ROLES))
        .error?.status
    ).toBe(403);
    expect((await authorizeOrgActor(undefined, ORG_ADMIN_ROLES)).error?.status).toBe(
      403
    );
  });

  test("rejects a path org that differs from the authenticated org", async () => {
    const result = await authorizeOrgActor(jwt(ADMIN), ORG_ADMIN_ROLES, OTHER_ORG);
    expect(result.error?.status).toBe(403);
    expect(mockDbExecute).not.toHaveBeenCalled();
  });

  test("uses the database role, not the cached one", async () => {
    const result = await authorizeOrgActor(jwt(MEMBER), ORG_ADMIN_ROLES, ORG);
    expect(result.error?.status).toBe(403);
  });

  test("owner-only actions reject admins", async () => {
    expect((await authorizeOrgActor(jwt(ADMIN), ORG_OWNER_ROLES)).error?.status).toBe(
      403
    );
    expect((await authorizeOrgActor(jwt(OWNER), ORG_OWNER_ROLES)).error).toBeNull();
  });

  test("rejects users who are not in the organization", async () => {
    const result = await authorizeOrgActor(jwt("nobody"), ORG_ADMIN_ROLES, ORG);
    expect(result.error?.status).toBe(403);
  });
});

describe("role and permission helpers", () => {
  test("only member and admin are assignable", () => {
    expect(isAssignableMemberRole("member")).toBe(true);
    expect(isAssignableMemberRole("admin")).toBe(true);
    expect(isAssignableMemberRole("owner")).toBe(false);
    expect(isAssignableMemberRole("superadmin")).toBe(false);
    expect(isAssignableMemberRole("")).toBe(false);
  });

  test("key permissions must be a subset of the caller's", () => {
    expect(isPermissionSubset("rw", "rw")).toBe(true);
    expect(isPermissionSubset("w", "rw")).toBe(true);
    expect(isPermissionSubset("r", "rw")).toBe(true);
    expect(isPermissionSubset("rw", "w")).toBe(false);
    expect(isPermissionSubset("r", "w")).toBe(false);
    expect(isPermissionSubset("g", "rw")).toBe(false);
    expect(isPermissionSubset("", "rw")).toBe(false);
  });
});
