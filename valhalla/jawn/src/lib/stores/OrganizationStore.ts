import {
  NewOrganizationParams,
  OnboardingStatus,
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

export class OrganizationStore extends BaseStore {
  async createNewOrganization(
    createOrgParams: NewOrganizationParams
  ): Promise<Result<NewOrganizationParams, string>> {
    try {
      // Insert the organization and return the inserted record
      const orgResult = await dbExecute<NewOrganizationParams>(
        `INSERT INTO organization (name, owner, tier, is_personal, has_onboarded, soft_delete, 
          organization_type, limits, color, icon, stripe_customer_id, org_provider_key)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          createOrgParams.name,
          createOrgParams.owner,
          createOrgParams.tier,
          createOrgParams.is_personal ?? false,
          createOrgParams.has_onboarded ?? false,
          createOrgParams.soft_delete ?? false,
          createOrgParams.organization_type ?? "user",
          createOrgParams.limits ?? {},
          createOrgParams.color,
          createOrgParams.icon,
          createOrgParams.stripe_customer_id,
          createOrgParams.org_provider_key,
        ]
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
        [new Date().toISOString(), createOrgParams.owner, insert.id, "owner"]
      );

      if (memberResult.error) {
        return err(
          memberResult.error || "Failed to create organization member"
        );
      }

      return ok(insert);
    } catch (error) {
      console.error("Failed to create organization:", error);
      return err(String(error));
    }
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
    const query = `
      select distinct on (om.member) email, member, org_role from organization_member om 
    let query;
    if (process.env.NEXT_PUBLIC_BETTER_AUTH === "true") {
      query = `
      select distinct on (om.member), pu.email, org_role from organization_member om 
        left join auth.users u on u.id = om.member
        left join public.user pu on pu.auth_user_id = u.id
        where om.organization = $1
    `;
    } else {
      query = `
      select u.email, member, org_role from organization_member om 
        left join auth.users u on u.id = om.member
        where om.organization = $1
      `;
    }

    return await dbExecute<{
      email: string;
      member: string;
      org_role: string;
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
      const result = await dbExecute(
        `DELETE FROM organization_member
         WHERE member = $1
         AND organization = $2`,
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

  async updateOrganizationMember(
    organizationId: string,
    userId: string,
    orgRole: string,
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

      // Check if user is a member of the organization
      const orgMemberResult = await dbExecute<{ org_role: string }>(
        `SELECT org_role
         FROM organization_member
         WHERE member = $1
         AND organization = $2
         LIMIT 1`,
        [userId, organizationId]
      );

      if (!orgMemberResult.data || orgMemberResult.data.length === 0) {
        return err("User is not a member of this organization");
      }

      const orgMember = orgMemberResult.data[0];
      const isAdmin = orgMember.org_role === "admin";
      const isOwner = org.owner === userId;

      if (!isAdmin && !isOwner) {
        return err("Unauthorized");
      }

      // Update the organization member's role
      const updateResult = await dbExecute(
        `UPDATE organization_member
         SET org_role = $1
         WHERE member = $2
         AND organization = $3`,
        [orgRole, memberId, organizationId]
      );

      if (updateResult.error) {
        return err(updateResult.error);
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
      await generateTempHeliconeAPIKey(organizationId);

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
