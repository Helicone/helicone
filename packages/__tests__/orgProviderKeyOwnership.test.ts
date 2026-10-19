import {
  checkOrgProviderKeyOwnership,
  needsResellerTypeCheck,
} from "../common/providerKeys/orgProviderKeyOwnership";

const ORG = "org-customer";
const RESELLER = "org-reseller";
const VICTIM = "org-victim";

describe("checkOrgProviderKeyOwnership (INC-710)", () => {
  test("allows a provider key owned by the organization itself", () => {
    expect(
      checkOrgProviderKeyOwnership({
        orgId: ORG,
        resellerId: null,
        providerKeyOrgId: ORG,
      })
    ).toEqual({ allowed: true, owner: "self" });
  });

  test("allows a provider key owned by the organization's reseller", () => {
    expect(
      checkOrgProviderKeyOwnership({
        orgId: ORG,
        resellerId: RESELLER,
        providerKeyOrgId: RESELLER,
        resellerOrganizationType: "reseller",
      })
    ).toEqual({ allowed: true, owner: "reseller" });
  });

  test("rejects a provider key owned by an unrelated organization", () => {
    expect(
      checkOrgProviderKeyOwnership({
        orgId: ORG,
        resellerId: null,
        providerKeyOrgId: VICTIM,
      }).allowed
    ).toBe(false);
    expect(
      checkOrgProviderKeyOwnership({
        orgId: ORG,
        resellerId: RESELLER,
        providerKeyOrgId: VICTIM,
        resellerOrganizationType: "reseller",
      }).allowed
    ).toBe(false);
  });

  test("rejects when reseller_id points at an organization that is not a reseller", () => {
    expect(
      checkOrgProviderKeyOwnership({
        orgId: ORG,
        resellerId: VICTIM,
        providerKeyOrgId: VICTIM,
        resellerOrganizationType: "user",
      }).allowed
    ).toBe(false);
    expect(
      checkOrgProviderKeyOwnership({
        orgId: ORG,
        resellerId: VICTIM,
        providerKeyOrgId: VICTIM,
      }).allowed
    ).toBe(false);
  });

  test("rejects when the provider key or its owner is missing", () => {
    expect(
      checkOrgProviderKeyOwnership({
        orgId: ORG,
        resellerId: RESELLER,
        providerKeyOrgId: null,
      }).allowed
    ).toBe(false);
    expect(
      checkOrgProviderKeyOwnership({
        orgId: "",
        resellerId: null,
        providerKeyOrgId: "",
      }).allowed
    ).toBe(false);
  });
});

describe("needsResellerTypeCheck", () => {
  test("only asks for the reseller type when the key belongs to reseller_id", () => {
    expect(
      needsResellerTypeCheck({
        orgId: ORG,
        resellerId: RESELLER,
        providerKeyOrgId: RESELLER,
      })
    ).toBe(true);
    expect(
      needsResellerTypeCheck({
        orgId: ORG,
        resellerId: RESELLER,
        providerKeyOrgId: ORG,
      })
    ).toBe(false);
    expect(
      needsResellerTypeCheck({
        orgId: ORG,
        resellerId: null,
        providerKeyOrgId: VICTIM,
      })
    ).toBe(false);
  });
});
