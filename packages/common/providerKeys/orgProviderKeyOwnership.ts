/**
 * INC-710: organization.org_provider_key makes Helicone attach a stored
 * provider key to requests made with that organization's customer-portal
 * API keys. The key must belong to the organization itself, or to the
 * reseller organization that created it.
 */
export interface OrgProviderKeyOwnershipInput {
  /** The organization whose org_provider_key is being used. */
  orgId: string;
  /** That organization's reseller_id, if any. */
  resellerId: string | null | undefined;
  /** provider_keys.org_id of the referenced provider key. */
  providerKeyOrgId: string | null | undefined;
  /**
   * organization_type of the reseller organization. Only needed when the
   * provider key belongs to resellerId rather than orgId.
   */
  resellerOrganizationType?: string | null;
}

export type OrgProviderKeyOwnership =
  | { allowed: true; owner: "self" | "reseller" }
  | { allowed: false; reason: string };

/**
 * True when the provider key belongs to resellerId (not the org itself), so
 * the caller has to look up the reseller's organization_type before deciding.
 */
export function needsResellerTypeCheck(
  input: Omit<OrgProviderKeyOwnershipInput, "resellerOrganizationType">
): boolean {
  return (
    !!input.providerKeyOrgId &&
    input.providerKeyOrgId !== input.orgId &&
    !!input.resellerId &&
    input.providerKeyOrgId === input.resellerId
  );
}

export function checkOrgProviderKeyOwnership(
  input: OrgProviderKeyOwnershipInput
): OrgProviderKeyOwnership {
  const { orgId, resellerId, providerKeyOrgId, resellerOrganizationType } =
    input;

  if (!orgId || !providerKeyOrgId) {
    return { allowed: false, reason: "missing organization or provider key" };
  }

  if (providerKeyOrgId === orgId) {
    return { allowed: true, owner: "self" };
  }

  if (!resellerId || providerKeyOrgId !== resellerId) {
    return {
      allowed: false,
      reason: "provider key belongs to an unrelated organization",
    };
  }

  if (resellerOrganizationType !== "reseller") {
    return {
      allowed: false,
      reason: "reseller_id does not reference a reseller organization",
    };
  }

  return { allowed: true, owner: "reseller" };
}
