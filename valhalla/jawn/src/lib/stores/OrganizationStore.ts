import {
  OnboardingStatus,
  OrganizationCreateRecord,
  OrganizationFilter,
  OrganizationLayout,
  OrganizationMember,
  OrganizationOwner,
  UpdateOrganizationParams,
} from "../../managers/organization/OrganizationManager";
import { BaseTempKey } from "../experiment/tempKeys/baseTempKey";
import { generateTempHeliconeAPIKey } from "../experiment/tempKeys/tempAPIKey";
import { setupDemoOrganizationRequests } from "../onboarding";
import { dbExecute } from "../shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";
import { BaseStore } from "./baseStore";

/**
 * Organization columns that may be returned to API clients. Billing
 * identifiers (stripe_customer_id, stripe_subscription_id,
 * stripe_subscription_item_id) and raw stripe_metadata are never returned;
 * only the add-on flags from stripe_metadata are exposed, as `addons`.
 */
export const ORGANIZATION_CLIENT_COLUMNS = [
  "allow_negative_balance",
  "color",
  "created_at",
  "credit_limit",
  "default_time_filter",
  "domain",
  "free_limit_exceeded",
  "gateway_discount_enabled",
  "governance_settings",
  "has_integrated",
  "has_onboarded",
  "icon",
  "id",
  "is_main_org",
  "is_personal",
  "limits",
  "name",
  "onboarding_status",
  "org_provider_key",
  "organization_type",
  "owner",
  "percent_to_log",
  "playground_helicone",
  "referral",
  "request_limit",
  "size",
  "soft_delete",
  "subscription_status",
  "tier",
] as const;

/** SELECT list for client-facing organization rows (table alias required). */
export function organizationClientSelect(alias: string): string {
  return [
    ...ORGANIZATION_CLIENT_COLUMNS.map((c) => `${alias}.${c}`),
    `${alias}.stripe_metadata->'addons' AS addons`,
  ].join(", ");
}

export class OrganizationStore extends BaseStore {
  /**
   * Callers must authorize the record (owner, org_provider_key, resellerId)
   * first; see OrganizationManager.createOrganization. Only the columns listed
   * here are ever written: billing identifiers (stripe_*), limits and tier are
   * server-controlled and cannot be supplied by a client.
   */
  async createNewOrganization(
    record: OrganizationCreateRecord,
    resellerId: string | null = null
  ): Promise<Result<{ id: string }, string>> {
    try {
      const columns = [
        "name",
        "owner",
        "tier",
        "is_personal",
        "has_onboarded",
        "soft_delete",
        "organization_type",
        "limits",
        "org_provider_key",
      ];
      const values: unknown[] = [
        record.name,
        record.owner,
        "free",
        false,
        record.has_onboarded,
        false,
        record.organization_type,
        {},
        record.org_provider_key,
      ];
      // color and icon have column defaults; only override when provided.
      if (record.color) {
        columns.push("color");
        values.push(record.color);
      }
      if (record.icon) {
        columns.push("icon");
        values.push(record.icon);
      }
      if (resellerId !== null) {
        columns.push("reseller_id");
        values.push(resellerId);
      }
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

      // Insert the organization and return the inserted record
      const orgResult = await dbExecute<{ id: string }>(
        `INSERT INTO organization (${columns.join(", ")})
         VALUES (${placeholders})
         RETURNING id`,
        values
      );

      if (orgResult.error || !orgResult.data || orgResult.data.length === 0) {
        return err(orgResult.error || "Failed to create organization");
      }

      const insert = orgResult.data[0];

      // Insert the organization member
      const memberResult = await dbExecute(
        `INSERT INTO organization_member 
         (created_at, member, organization, org_role)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [new Date().toISOString(), record.owner, insert.id, "owner"]
      );

      if (memberResult.error) {
        return err(
          memberResult.error || "Failed to create organization member"
        );
      }

      return ok({ id: insert.id });
    } catch (error) {
      console.error("Failed to create organization:", error);
      return err(String(error));
    }
  }

  async isProviderKeyOwnedByOrg(
    providerKeyId: string,
    orgId: string
  ): Promise<Result<boolean, string>> {
    const result = await dbExecute<{ id: string }>(
      `SELECT id FROM provider_keys
       WHERE id = $1 AND org_id = $2 AND soft_delete = false
       LIMIT 1`,
      [providerKeyId, orgId]
    );
    if (result.error) {
      return err(result.error);
    }
    return ok((result.data?.length ?? 0) > 0);
  }

  async createStarterOrg(userId: string): Promise<Result<string, string>> {
    const result = await dbExecute<{ id: string }>(
      `INSERT INTO organization (name, owner, tier, is_personal, has_onboarded, soft_delete)
       SELECT 'My Organization', $1, 'free', true, false, false
       WHERE NOT EXISTS (
         SELECT 1 FROM organization 
         WHERE owner = $1 
         AND tier = 'free' 
         AND name = 'My Organization'
       )
       RETURNING id;`,
      [userId]
    );

    if (result.error || !result.data || result.data.length === 0) {
      // If insert failed, try to get existing starter org
      const existing = await dbExecute<{ id: string }>(
        `SELECT id FROM organization 
         WHERE owner = $1 
         AND tier = 'free' 
         AND name = 'My Organization'
         LIMIT 1`,
        [userId]
      );

      if (existing.error || !existing.data || existing.data.length === 0) {
        return err("Failed to create or find starter organization");
      }

      return ok(existing.data[0].id);
    }

    return ok(result.data[0].id);
  }

  async getOrganizationMember(
    userId: string,
    organizationId: string
  ): Promise<Result<{ org_role: string }, string>> {
    const orgMember = await dbExecute<{ org_role: string }>(
      "SELECT org_role FROM organization_member WHERE organization = $1 AND member = $2",
      [organizationId, userId]
    );

    if (!orgMember.data || orgMember.data.length === 0) {
      return err("User is not a member of this organization");
    }
    return ok(orgMember.data[0]);
  }

  async updateOrganization(
    updateOrgParams: UpdateOrganizationParams,
    organizationId: string
  ): Promise<Result<string, string>> {
    try {
      // Build dynamic SQL based on provided parameters - only allow name, color, and icon
      const updateFields = [];
      const params = [];
      let paramIndex = 1;

      if (updateOrgParams.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        params.push(updateOrgParams.name);
        paramIndex++;
      }

      if (updateOrgParams.color !== undefined) {
        updateFields.push(`color = $${paramIndex}`);
        params.push(updateOrgParams.color || null);
        paramIndex++;
      }

      if (updateOrgParams.icon !== undefined) {
        updateFields.push(`icon = $${paramIndex}`);
        params.push(updateOrgParams.icon || null);
        paramIndex++;
      }

      if (updateOrgParams.default_time_filter !== undefined) {
        updateFields.push(`default_time_filter = $${paramIndex}`);
        params.push(updateOrgParams.default_time_filter);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return err("No fields to update");
      }

      const sql = `
        UPDATE organization 
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex} 
        RETURNING id`;

      params.push(organizationId);

      // Execute the query
      const result = await dbExecute<{ id: string }>(sql, params);

      if (result.error || !result.data || result.data.length === 0) {
        console.error(`Failed to update organization: ${result.error}`);
        return err(`Failed to update organization: ${result.error}`);
      }

      return ok(result.data[0].id);
    } catch (error) {
      console.error(`Failed to update organization: ${error}`);
      return err(`Failed to update organization: ${error}`);
    }
  }

  async getUserByEmail(email: string): Promise<Result<string | null, string>> {
    const getUserIdQuery = `
      SELECT id FROM auth.users WHERE email = $1 LIMIT 1
    `;
    let { data: userId, error: userIdError } = await dbExecute<{ id: string }>(
      getUserIdQuery,
      [email]
    );

    if (userIdError) {
      return err(userIdError ?? "User not found");
    }

    if (!userId || userId.length === 0) {
      return ok(null);
    }

    return ok(userId[0].id);
  }

  async addMemberToOrganization(
    userId: string,
    organizationId: string
  ): Promise<Result<string, string>> {
    try {
      const result = await dbExecute<{ member: string }>(
        `INSERT INTO organization_member (organization, member)
         VALUES ($1, $2)
         RETURNING member`,
        [organizationId, userId]
      );

      if (result.error) {
        return err(result.error);
      }

      // If nothing was inserted (due to conflict), still return success
      return ok(userId);
    } catch (error) {
      const errorMessage = String(error);
      // If error is a unique constraint violation, user is already added
      if (
        errorMessage.includes("duplicate key value violates unique constraint")
      ) {
        return ok(userId); // User already added
      }
      return err(errorMessage);
    }
  }

  async createOrganizationFilter(insertRequest: {
    organization_id: string;
    type: "dashboard" | "requests";
    filters: OrganizationFilter[];
  }): Promise<Result<string, string>> {
    try {
      const result = await dbExecute<{ id: string }>(
        `INSERT INTO organization_layout
         (organization_id, type, filters)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          insertRequest.organization_id,
          insertRequest.type,
          JSON.stringify(insertRequest.filters),
        ]
      );

      if (result.error || !result.data || result.data.length === 0) {
        console.error(`Failed to create filter: ${result.error}`);
        return err(`Failed to create filter: ${result.error}`);
      }

      return ok(result.data[0].id);
    } catch (error) {
      console.error(`Failed to create filter: ${error}`);
      return err(`Failed to create filter: ${error}`);
    }
  }

  async deleteOrganization(): Promise<Result<string, string>> {
    try {
      const result = await dbExecute<{ id: string }>(
        `UPDATE organization
         SET soft_delete = true
         WHERE id = $1
         RETURNING id`,
        [this.organizationId]
      );

      if (result.error) {
        return err("internal error: " + result.error);
      }
      return ok("success");
    } catch (error) {
      return err("internal error: " + error);
    }
  }

  async getOrganizationLayout(
    organizationId: string,
    filterType: string
  ): Promise<Result<OrganizationLayout, string>> {
    try {
      const result = await dbExecute<OrganizationLayout>(
        `SELECT id, type, filters, organization_id
         FROM organization_layout
         WHERE organization_id = $1
         AND type = $2
         LIMIT 1`,
        [organizationId, filterType]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err("Organization layout not found");
      }

      const layout = result.data[0];
      return ok({
        id: layout.id,
        type: layout.type,
        filters: layout.filters as OrganizationFilter[],
        organization_id: layout.organization_id,
      });
    } catch (error) {
      return err(String(error));
    }
  }

  async updateOrganizationFilter(
    organizationId: string,
    type: string,
    filters: OrganizationFilter[]
  ): Promise<Result<string, string>> {
    try {
      const result = await dbExecute(
        `UPDATE organization_layout
         SET filters = $1
         WHERE organization_id = $2
         AND type = $3
         RETURNING id`,
        [JSON.stringify(filters), organizationId, type]
      );

      if (result.error) {
        return err("internal error: " + result.error);
      }
      return ok("success");
    } catch (error) {
      return err("internal error: " + error);
    }
  }

  async getOrganizationMembers(
    organizationId: string
  ): Promise<Result<OrganizationMember[], string>> {
    let query;
    if (process.env.NEXT_PUBLIC_BETTER_AUTH === "true") {
      query = `
      select pu.email, member, org_role, created_at from organization_member om 
        left join auth.users u on u.id = om.member
        left join public.user pu on pu.auth_user_id = u.id
        where om.organization = $1
    `;
    } else {
      query = `
      select u.email, member, org_role, om.created_at from organization_member om 
        left join auth.users u on u.id = om.member
        where om.organization = $1
      `;
    }

    return await dbExecute<{
      email: string;
      member: string;
      org_role: string;
      created_at: string;
    }>(query, [organizationId]);
  }

  async getOrganizationOwner(
    organizationId: string,
    userId: string
  ): Promise<Result<OrganizationOwner[], string>> {
    const query = `
      select 
        us.tier as tier,
        email
        from organization o 
        left join auth.users u on u.id = o.owner
        left join user_settings us on us.user = u.id
        where o.id = $1 AND (
          -- Auth check
          EXISTS (
            select * from organization_member om
            left join organization o on o.id = om.organization
            where om.organization = $1 and (
              o.owner = $2 or om.member = $2
            )
          )
          OR o.owner = $2
        )
    `;

    const result = await dbExecute<OrganizationOwner>(query, [
      organizationId,
      userId,
    ]);

    if (result.error || !result.data || result.data.length === 0) {
      return err(result.error ?? "No access to org");
    }
    return ok(result.data);
  }

  async isUserOwner(organizationId: string, userId: string): Promise<boolean> {
    const query = `
      select * from organization_member om
      where om.organization = $1 and om.member = $2 and om.org_role = 'owner'
    `;
    const result = await dbExecute<{ org_role: string }>(query, [
      organizationId,
      userId,
    ]);
    if (result.error || !result.data || result.data.length === 0) {
      return false;
    }
    return result.data[0].org_role === "owner";
  }

  async removeMemberFromOrganization(
    organizationId: string,
    memberId: string
  ): Promise<Result<null, string>> {
    if (!organizationId) {
      return err("Invalid OrgId");
    }
    if (!memberId) {
      return err("Invalid MemberId");
    }

    try {
      // Never removes the organization owner, whatever the caller checked.
      const result = await dbExecute(
        `DELETE FROM organization_member
         WHERE member = $1
         AND organization = $2
         AND member <> (SELECT owner FROM organization WHERE id = $2)`,
        [memberId, organizationId]
      );

      if (result.error) {
        return err(result.error);
      }

      return ok(null);
    } catch (error) {
      return err(String(error));
    }
  }

  /**
   * Sets a member's role. Callers must authorize first (see
   * OrganizationManager.updateMember). As defence in depth the statement can
   * never touch the organization owner or assign anything but member/admin.
   */
  async updateOrganizationMember(
    organizationId: string,
    orgRole: "member" | "admin",
    memberId: string
  ): Promise<Result<null, string>> {
    if (orgRole !== "member" && orgRole !== "admin") {
      return err("Invalid role");
    }
    try {
      const updateResult = await dbExecute<{ member: string }>(
        `UPDATE organization_member
         SET org_role = $1
         WHERE member = $2
         AND organization = $3
         AND org_role <> 'owner'
         AND member <> (SELECT owner FROM organization WHERE id = $3)
         RETURNING member`,
        [orgRole, memberId, organizationId]
      );

      if (updateResult.error) {
        return err(updateResult.error);
      }
      if (!updateResult.data || updateResult.data.length === 0) {
        return err("Member not found");
      }

      return ok(null);
    } catch (error) {
      return err(String(error));
    }
  }

  async updateOrganizationOwner(
    organizationId: string,
    userId: string,
    memberId: string
  ): Promise<Result<null, string>> {
    try {
      // Check if organization exists and user has access
      const orgResult = await dbExecute<{ id: string; owner: string }>(
        `SELECT id, owner
         FROM organization
         WHERE id = $1
         LIMIT 1`,
        [organizationId]
      );

      if (orgResult.error || !orgResult.data || orgResult.data.length === 0) {
        return err("Organization not found");
      }

      const org = orgResult.data[0];

      const isOwner = org.owner === userId;

      if (!isOwner) {
        return err("Unauthorized");
      }

      // The new owner must already be a member of this organization. Without
      // this check `organization.owner` could be pointed at an arbitrary user id.
      const memberResult = await dbExecute<{ member: string }>(
        `SELECT member
         FROM organization_member
         WHERE organization = $1 AND member = $2
         LIMIT 1`,
        [organizationId, memberId]
      );
      if (
        memberResult.error ||
        !memberResult.data ||
        memberResult.data.length === 0
      ) {
        return err("New owner must be an existing member of the organization");
      }

      // Update the organization owner
      const updateResult = await dbExecute(
        `UPDATE organization_member
         SET org_role = $1
         WHERE member = $2
         AND organization = $3`,
        ["owner", memberId, organizationId]
      );

      if (updateResult.error) {
        return err(updateResult.error);
      }

      // change current owner to admin
      const updateAdminResult = await dbExecute(
        `UPDATE organization_member
         SET org_role = $1
         WHERE member = $2
         AND organization = $3`,
        ["admin", userId, organizationId]
      );

      if (updateAdminResult.error) {
        return err(updateAdminResult.error);
      }

      // Update the organization owner
      const updateOwnerResult = await dbExecute(
        `UPDATE organization
         SET owner = $1
         WHERE id = $2`,
        [memberId, organizationId]
      );
      if (updateOwnerResult.error) {
        return err(updateOwnerResult.error);
      }

      return ok(null);
    } catch (error) {
      return err(String(error));
    }
  }

  async checkAccessToMutateOrg(
    orgId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check if organization exists
      const orgResult = await dbExecute<{
        id: string;
      }>(
        `SELECT id
         FROM organization
         WHERE id = $1
         LIMIT 1`,
        [orgId]
      );

      if (orgResult.error || !orgResult.data || orgResult.data.length === 0) {
        return false;
      }

      const org = orgResult.data[0];

      // Check if user has access to the organization
      if (await this._checkAccessToOrg(orgId, userId)) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error checking access to mutate org:", error);
      return false;
    }
  }

  public async checkUserBelongsToOrg(
    orgId: string,
    userId: string
  ): Promise<boolean> {
    const query = `
      select * from organization_member om
      where om.organization = $1 and (om.member = $2)
    `;

    const { data, error } = await dbExecute<{
      email: string;
      member: string;
      org_role: string;
    }>(query, [orgId, userId]);

    if (error || !data || data.length === 0) {
      return false;
    }
    return true;
  }

  private async _checkAccessToOrg(
    orgId: string,
    userId: string
  ): Promise<boolean> {
    const query = `
  select * from organization_member om
  where om.organization = $1 and (om.member = $2) and (om.org_role = 'admin' or om.org_role = 'owner')
`;

    const { data, error } = await dbExecute<{
      email: string;
      member: string;
      org_role: string;
    }>(query, [orgId, userId]);

    return error === null && data?.length > 0;
  }

  public async setupDemo(
    userId: string,
    organizationId: string
  ): Promise<Result<null, string>> {
    const tempKey: Result<BaseTempKey, string> =
      await generateTempHeliconeAPIKey(organizationId, {
        kind: "actor",
        userId,
      });

    const hasBeenSetup = await dbExecute<{ demoDataSetup: boolean }>(
      `select onboarding_status->>'demoDataSetup' as demoDataSetup from organization where id = $1`,
      [organizationId]
    );

    if (
      hasBeenSetup.error ||
      !hasBeenSetup.data ||
      hasBeenSetup.data.length === 0
    ) {
      return err("Organization not found");
    }

    if (hasBeenSetup.data[0].demoDataSetup) {
      return ok(null);
    }

    if (tempKey.error) {
      return err(tempKey.error);
    }

    try {
      const result = await dbExecute<{ id: string }>(
        `UPDATE organization 
         SET onboarding_status = COALESCE(onboarding_status, '{}'::jsonb) || '{"demoDataSetup": true}'::jsonb
         WHERE id = $1
         RETURNING id`,
        [organizationId]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err("Failed to update organization onboarding status");
      }

      await tempKey.data?.with(async (apiKey) => {
        await setupDemoOrganizationRequests({
          heliconeApiKey: apiKey,
        });
      });

      return ok(null);
    } catch (error) {
      return err(`Failed to setup demo: ${error}`);
    }
  }

  async updateOnboardingStatus(
    onboardingStatus: OnboardingStatus,
    name: string
  ): Promise<Result<string, string>> {
    const hasOnboarded = onboardingStatus.hasOnboarded ?? false;
    const hasIntegrated = onboardingStatus.hasIntegrated ?? false;
    const result = await dbExecute<{ id: string }>(
      `UPDATE organization 
       SET onboarding_status = COALESCE(onboarding_status, '{}'::jsonb) || $1::jsonb,
           name = COALESCE(NULLIF($2, ''), name),
           has_onboarded = CASE WHEN has_onboarded = true THEN true ELSE $3 END,
           has_integrated = CASE WHEN has_integrated = true THEN true ELSE $4 END
       WHERE id = $5
       RETURNING id`,
      [onboardingStatus, name, hasOnboarded, hasIntegrated, this.organizationId]
    );

    if (result.error || !result.data || result.data.length === 0) {
      console.error("Failed to update onboarding status:", result.error);
      return err(result.error ?? "Failed to update onboarding status");
    }

    return ok(result.data[0].id);
  }
}
