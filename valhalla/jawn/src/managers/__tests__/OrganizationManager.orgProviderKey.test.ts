import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));
// These pull in clients that connect at import time; createOrganization does
// not use them.
jest.mock("../../packages/common/auth/server/AuthClientFactory", () => ({
  getHeliconeAuthClient: jest.fn(),
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

const USER_ID = "11111111-1111-1111-1111-111111111111";
const CALLER_ORG_ID = "22222222-2222-2222-2222-222222222222";
const OTHER_ORG_KEY_ID = "33333333-3333-3333-3333-333333333333";
const OWN_KEY_ID = "44444444-4444-4444-4444-444444444444";

type DbState = {
  callerOrgType: string;
  callerRole: string | null;
  ownedKeyIds: string[];
};

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;

function installDb(state: DbState) {
  mockDbExecute.mockImplementation((async (sql: string, params: any[]) => {
    const q = sql.replace(/\s+/g, " ").trim();
    if (q.startsWith("SELECT * FROM organization WHERE id = $1")) {
      return {
        data: [
          {
            id: params[0],
            organization_type: state.callerOrgType,
            soft_delete: false,
          },
        ],
        error: null,
      };
    }
    if (q.startsWith("SELECT org_role FROM organization_member")) {
      return state.callerRole
        ? { data: [{ org_role: state.callerRole }], error: null }
        : { data: [], error: null };
    }
    if (q.startsWith("SELECT id FROM provider_keys")) {
      const [keyId, orgId] = params;
      const owned = orgId === CALLER_ORG_ID && state.ownedKeyIds.includes(keyId);
      return { data: owned ? [{ id: keyId }] : [], error: null };
    }
    if (q.startsWith("INSERT INTO organization (")) {
      return { data: [{ id: "new-org-id" }], error: null };
    }
    if (q.startsWith("INSERT INTO organization_member")) {
      return { data: [{}], error: null };
    }
    throw new Error(`Unexpected query: ${q}`);
  }) as any);
}

function insertCall() {
  return mockDbExecute.mock.calls.find(([sql]) =>
    (sql as string).includes("INSERT INTO organization (")
  );
}

function insertedValue(column: string): unknown {
  const call = insertCall();
  if (!call) return undefined;
  const sql = call[0] as string;
  const columns = sql
    .slice(sql.indexOf("(") + 1, sql.indexOf(")"))
    .split(",")
    .map((c) => c.trim());
  const idx = columns.indexOf(column);
  return idx === -1 ? undefined : (call[1] as unknown[])[idx];
}

describe("OrganizationManager.createOrganization org_provider_key (INC-710)", () => {
  const authParams: AuthParams = {
    organizationId: CALLER_ORG_ID,
    userId: USER_ID,
    role: "admin",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseParams = {
    name: "New org",
    owner: USER_ID,
    tier: "free",
  };

  test("rejects another organization's provider key on a plain organization", async () => {
    installDb({ callerOrgType: "user", callerRole: "owner", ownedKeyIds: [] });
    const manager = new OrganizationManager(authParams);

    const result = await manager.createOrganization({
      ...baseParams,
      org_provider_key: OTHER_ORG_KEY_ID,
    });

    expect(result.error).toBeTruthy();
    expect(insertCall()).toBeUndefined();
  });

  test("rejects org_provider_key even when it belongs to the caller if the org is not a customer", async () => {
    installDb({
      callerOrgType: "reseller",
      callerRole: "owner",
      ownedKeyIds: [OWN_KEY_ID],
    });
    const manager = new OrganizationManager(authParams);

    const result = await manager.createOrganization({
      ...baseParams,
      org_provider_key: OWN_KEY_ID,
    });

    expect(result.error).toBeTruthy();
    expect(insertCall()).toBeUndefined();
  });

  test("rejects a customer org whose provider key is not owned by the reseller", async () => {
    installDb({
      callerOrgType: "reseller",
      callerRole: "owner",
      ownedKeyIds: [OWN_KEY_ID],
    });
    const manager = new OrganizationManager(authParams);

    const result = await manager.createOrganization({
      ...baseParams,
      organization_type: "customer",
      org_provider_key: OTHER_ORG_KEY_ID,
    });

    expect(result.error).toBe("Provider key not found");
    expect(insertCall()).toBeUndefined();
  });

  test("rejects customer creation from a non-reseller org", async () => {
    installDb({ callerOrgType: "user", callerRole: "owner", ownedKeyIds: [] });
    const manager = new OrganizationManager(authParams);

    const result = await manager.createOrganization({
      ...baseParams,
      organization_type: "customer",
      org_provider_key: OTHER_ORG_KEY_ID,
    });

    expect(result.error).toBe("Only resellers can create customers");
    expect(insertCall()).toBeUndefined();
  });

  test("rejects customer creation by a reseller member who is not an admin", async () => {
    installDb({
      callerOrgType: "reseller",
      callerRole: "member",
      ownedKeyIds: [OWN_KEY_ID],
    });
    const manager = new OrganizationManager(authParams);

    const result = await manager.createOrganization({
      ...baseParams,
      organization_type: "customer",
      org_provider_key: OWN_KEY_ID,
    });

    expect(result.error).toBe("Only reseller admins can create customers");
    expect(insertCall()).toBeUndefined();
  });

  test("rejects self-provisioned reseller organizations", async () => {
    installDb({ callerOrgType: "user", callerRole: "owner", ownedKeyIds: [] });
    const manager = new OrganizationManager(authParams);

    const result = await manager.createOrganization({
      ...baseParams,
      organization_type: "reseller",
    });

    expect(result.error).toBe("Invalid organization type");
    expect(insertCall()).toBeUndefined();
  });

  test("allows a reseller admin to attach its own provider key to a customer org", async () => {
    installDb({
      callerOrgType: "reseller",
      callerRole: "admin",
      ownedKeyIds: [OWN_KEY_ID],
    });
    const manager = new OrganizationManager(authParams);

    const result = await manager.createOrganization({
      ...baseParams,
      organization_type: "customer",
      org_provider_key: OWN_KEY_ID,
      // A client-supplied reseller_id must be ignored.
      ...({ reseller_id: "99999999-9999-9999-9999-999999999999" } as object),
    });

    expect(result.error).toBeNull();
    expect(insertedValue("org_provider_key")).toBe(OWN_KEY_ID);
    expect(insertedValue("organization_type")).toBe("customer");
    expect(insertedValue("reseller_id")).toBe(CALLER_ORG_ID);
  });

  test("creates a plain organization without touching reseller_id", async () => {
    installDb({ callerOrgType: "user", callerRole: "owner", ownedKeyIds: [] });
    const manager = new OrganizationManager(authParams);

    const result = await manager.createOrganization({ ...baseParams });

    expect(result.error).toBeNull();
    expect(insertedValue("org_provider_key")).toBeNull();
    expect(insertedValue("organization_type")).toBe("user");
    expect(insertedValue("reseller_id")).toBeUndefined();
  });
});

describe("OrganizationManager.updateOrganization org_provider_key (INC-710)", () => {
  test("rejects attempts to set org_provider_key", async () => {
    mockDbExecute.mockReset();
    const manager = new OrganizationManager({
      organizationId: CALLER_ORG_ID,
      userId: USER_ID,
      role: "admin",
    });

    const result = await manager.updateOrganization(
      { name: "x", org_provider_key: OTHER_ORG_KEY_ID },
      CALLER_ORG_ID
    );

    expect(result.error).toBe("org_provider_key cannot be updated");
    expect(mockDbExecute).not.toHaveBeenCalled();
  });
});
