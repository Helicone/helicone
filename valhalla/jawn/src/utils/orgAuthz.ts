import { AuthParams } from "../packages/common/auth/types";
import { dbExecute } from "../lib/shared/db/dbExecute";
import { err, ok, Result } from "../packages/common/result";

/**
 * Authorization helpers for organization-scoped mutations.
 *
 * Rules:
 *  - Only a real user session (JWT) can act as a person. Helicone API keys
 *    carry the user_id of whoever created them, which is not proof that the
 *    caller is that user, and proxy keys carry no user at all.
 *  - The organization being acted on must be the organization the caller
 *    authenticated against (authParams.organizationId). A path parameter alone
 *    never grants access to another organization.
 *  - The caller's role is re-read from the database rather than trusted from
 *    the (cached) auth result. organization.owner is the canonical owner.
 */

export type VerifiedOrgRole = "owner" | "admin" | "member";

export type OrgAuthzError = {
  status: 401 | 403 | 404 | 500;
  message: string;
};

export type OrgActor = {
  userId: string;
  organizationId: string;
  role: VerifiedOrgRole;
  ownerId: string;
};

export const ORG_ROLE_FORBIDDEN =
  "Forbidden: this action requires a signed-in organization owner or admin. Helicone API keys cannot perform it.";

/**
 * Looks up the caller's role in an organization from the database.
 * Returns null when the user has no role in that (non-deleted) organization.
 */
export async function getVerifiedOrgRole(
  organizationId: string,
  userId: string
): Promise<Result<{ role: VerifiedOrgRole; ownerId: string } | null, string>> {
  const result = await dbExecute<{
    owner: string;
    org_role: string | null;
  }>(
    `SELECT organization.owner, organization_member.org_role
     FROM organization
     LEFT JOIN organization_member
       ON organization_member.organization = organization.id
       AND organization_member.member = $2
     WHERE organization.id = $1
       AND organization.soft_delete = false
     LIMIT 1`,
    [organizationId, userId]
  );

  if (result.error) {
    return err(result.error);
  }
  const row = result.data?.[0];
  if (!row) {
    return ok(null);
  }
  if (row.owner === userId) {
    return ok({ role: "owner", ownerId: row.owner });
  }
  // A member row claiming "owner" without being organization.owner is treated
  // as admin: ownership is defined by organization.owner only.
  if (row.org_role === "owner" || row.org_role === "admin") {
    return ok({ role: "admin", ownerId: row.owner });
  }
  if (row.org_role === "member") {
    return ok({ role: "member", ownerId: row.owner });
  }
  return ok(null);
}

/**
 * Authorizes a JWT user to act on `targetOrgId` with one of `allowedRoles`.
 *
 * `targetOrgId` is the organization named by the request (e.g. a path
 * parameter). Pass `undefined` when the route acts on the authenticated
 * organization implicitly.
 */
export async function authorizeOrgActor(
  authParams: AuthParams | undefined,
  allowedRoles: VerifiedOrgRole[],
  targetOrgId?: string
): Promise<Result<OrgActor, OrgAuthzError>> {
  if (!authParams || authParams.authType !== "jwt") {
    return err({ status: 403, message: ORG_ROLE_FORBIDDEN });
  }
  if (!authParams.userId || !authParams.organizationId) {
    return err({ status: 401, message: "Unauthorized" });
  }
  if (
    targetOrgId !== undefined &&
    targetOrgId !== authParams.organizationId
  ) {
    return err({
      status: 403,
      message:
        "Forbidden: the organization in the request does not match the organization you are signed in to",
    });
  }

  const role = await getVerifiedOrgRole(
    authParams.organizationId,
    authParams.userId
  );
  if (role.error !== null) {
    return err({ status: 500, message: "Error checking organization role" });
  }
  if (!role.data) {
    return err({ status: 403, message: "Forbidden" });
  }
  if (!allowedRoles.includes(role.data.role)) {
    return err({ status: 403, message: ORG_ROLE_FORBIDDEN });
  }
  return ok({
    userId: authParams.userId,
    organizationId: authParams.organizationId,
    role: role.data.role,
    ownerId: role.data.ownerId,
  });
}

export const ORG_ADMIN_ROLES: VerifiedOrgRole[] = ["owner", "admin"];
export const ORG_OWNER_ROLES: VerifiedOrgRole[] = ["owner"];

/** Roles that may be assigned through update_member. */
export const ASSIGNABLE_MEMBER_ROLES = ["member", "admin"] as const;
export type AssignableMemberRole = (typeof ASSIGNABLE_MEMBER_ROLES)[number];

export function isAssignableMemberRole(
  role: string
): role is AssignableMemberRole {
  return (ASSIGNABLE_MEMBER_ROLES as readonly string[]).includes(role);
}

/**
 * Key permissions are ordered: "rw" includes everything "w" can do. A caller
 * may only mint keys whose permissions are a subset of its own. JWT owners and
 * admins hold the full "rw" set.
 */
export function isPermissionSubset(
  requested: string,
  callerPermissions: string
): boolean {
  const requestedSet = new Set(requested.split(""));
  const callerSet = new Set(callerPermissions.split(""));
  if (requestedSet.size === 0) {
    return false;
  }
  for (const p of requestedSet) {
    if (!callerSet.has(p)) {
      return false;
    }
  }
  return true;
}

/**
 * Convenience wrapper for routes that act on the authenticated organization
 * and require a signed-in owner or admin. Returns null when allowed.
 */
export async function checkJwtOrgAdmin(
  authParams: AuthParams | undefined
): Promise<OrgAuthzError | null> {
  const actor = await authorizeOrgActor(authParams, ORG_ADMIN_ROLES);
  return actor.error;
}
