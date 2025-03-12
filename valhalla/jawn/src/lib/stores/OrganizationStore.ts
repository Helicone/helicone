import {
  NewOrganizationParams,
  OnboardingStatus,
  OrganizationFilter,
  OrganizationLayout,
  OrganizationMember,
  OrganizationOwner,
  UpdateOrganizationParams,
} from "../../managers/organization/OrganizationManager";
import { hashAuth } from "../../utils/hash";
import { supabaseServer } from "../db/supabase";
import { BaseTempKey } from "../experiment/tempKeys/baseTempKey";
import { generateTempHeliconeAPIKey } from "../experiment/tempKeys/tempAPIKey";
import { setupDemoOrganizationRequests } from "../onboarding";
import { dbExecute } from "../shared/db/dbExecute";
import { err, ok, Result } from "../shared/result";
import { BaseStore } from "./baseStore";

export class OrganizationStore extends BaseStore {
  async createNewOrganization(
    createOrgParams: NewOrganizationParams
  ): Promise<Result<NewOrganizationParams, string>> {
    const { data: insert, error } = await supabaseServer.client
      .from("organization")
      .insert([createOrgParams])
      .select("*")
      .single();

    if (error || !insert) {
      return err(error.message ?? "Failed to create organization");
    }

    const { data: memberInsert, error: memberError } =
      await supabaseServer.client
        .from("organization_member")
        .insert({
          created_at: new Date().toISOString(),
          member: createOrgParams.owner,
          organization: insert.id,
          org_role: "owner",
        })
        .select("*");

    if (memberError || !memberInsert) {
      return err(memberError?.message ?? "Failed to create organization");
    }
    return ok(insert);
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
    const { data, error } = await supabaseServer.client
      .from("organization")
      .update({
        name: updateOrgParams.name,
        color: updateOrgParams.color,
        icon: updateOrgParams.icon,
        ...(updateOrgParams.variant === "reseller" && {
          org_provider_key: updateOrgParams.org_provider_key,
          limits: updateOrgParams.limits,
          reseller_id: updateOrgParams.reseller_id,
          organization_type: "customer",
        }),
      })
      .eq("id", organizationId)
      .select("id");

    if (error || !data || data.length === 0) {
      console.error(`Failed to update organization: ${error}`);
      return err(`Failed to update organization: ${error}`);
    }
    return ok(data[0].id);
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
    const { error: insertError } = await supabaseServer.client
      .from("organization_member")
      .insert([{ organization: organizationId, member: userId! }]);

    if (insertError && insertError !== null) {
      if (insertError.code === "23505") {
        return ok(userId!); // User already added
      }
      return err(insertError.message);
    }

    return ok(userId!);
  }

  async createOrganizationFilter(insertRequest: {
    organization_id: string;
    type: "dashboard" | "requests" | "filter_ast";
    filters: OrganizationFilter[];
  }): Promise<Result<string, string>> {
    const insert = await supabaseServer.client
      .from("organization_layout")
      .insert([insertRequest as any])
      .select("*")
      .single();

    if (insert.error || !insert.data) {
      console.error(`Failed to create filter: ${insert.error}`);
      return err(`Failed to create filter: ${insert.error}`);
    }
    return ok(insert.data.id);
  }

  async deleteOrganization(): Promise<Result<string, string>> {
    const deleteRes = await supabaseServer.client
      .from("organization")
      .update({
        soft_delete: true,
      })
      .eq("id", this.organizationId);

    if (deleteRes.error) {
      return err("internal error" + deleteRes.error);
    }
    return ok("success");
  }

  async getOrganizationLayout(
    organizationId: string,
    filterType: string
  ): Promise<Result<OrganizationLayout, string>> {
    const { data: layout, error } = await supabaseServer.client
      .from("organization_layout")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("type", filterType)
      .single();

    if (error !== null) {
      return err(error.message);
    }

    return ok({
      id: layout.id,
      type: layout.type,
      filters: layout.filters as OrganizationFilter[],
      organization_id: layout.organization_id,
    });
  }

  async updateOrganizationFilter(
    organizationId: string,
    type: string,
    filters: OrganizationFilter[]
  ): Promise<Result<string, string>> {
    const updateRes = await supabaseServer.client
      .from("organization_layout")
      .upsert({
        organization_id: organizationId,
        type: type,
        filters: filters as any,
      })
      .eq("organization_id", organizationId)
      .eq("type", type);

    if (updateRes.error) {
      return err("internal error" + updateRes.error);
    }
    return ok("success");
  }

  async getOrganizationMembers(
    organizationId: string
  ): Promise<Result<OrganizationMember[], string>> {
    const query = `
      select email, member, org_role from organization_member om 
        left join auth.users u on u.id = om.member
        where om.organization = $1
    `;

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
    const { error: deleteError } = await supabaseServer.client
      .from("organization_member")
      .delete()
      .eq("member", memberId)
      .eq("organization", organizationId);

    if (deleteError !== null) {
      return err(deleteError.message);
    }
    return ok(null);
  }

  async updateOrganizationMember(
    organizationId: string,
    userId: string,
    orgRole: string,
    memberId: string
  ): Promise<Result<null, string>> {
    const orgAccess = await supabaseServer.client
      .from("organization")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgAccess.error !== null || orgAccess.data === null) {
      return err(orgAccess.error.message);
    }

    const orgMember = await supabaseServer.client
      .from("organization_member")
      .select("*")
      .eq("member", userId)
      .eq("organization", organizationId)
      .single();

    if (!orgMember.data) {
      return err("User is not a member of this organization");
    }

    const isAdmin = orgMember !== null && orgMember.data.org_role === "admin";
    const isOwner = orgAccess.data.owner === userId;

    if (!isAdmin && !isOwner) {
      return err("Unauthorized");
    }

    const { error } = await supabaseServer.client
      .from("organization_member")
      .update({
        org_role: orgRole,
      })
      .match({ member: memberId, organization: organizationId });

    if (error) {
      return err(error.message);
    }
    return ok(null);
  }

  async checkAccessToMutateOrg(
    orgId: string,
    userId: string
  ): Promise<boolean> {
    const orgToCheck = await supabaseServer.client
      .from("organization")
      .select("*")
      .eq("id", orgId)
      .single();

    if (!orgToCheck.data || orgToCheck.error !== null) {
      return false;
    }
    if (await this._checkAccessToOrg(orgId as string, userId)) {
      return true;
    } else if (
      orgToCheck.data.reseller_id &&
      (await this._checkAccessToOrg(
        orgToCheck.data.reseller_id as string,
        userId
      ))
    ) {
      return true;
    } else {
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

    if (tempKey.error) {
      return err(tempKey.error);
    }

    try {
      await tempKey.data?.with(async (apiKey) => {
        await setupDemoOrganizationRequests({
          heliconeApiKey: apiKey,
        });
      });

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

      return ok(null);
    } catch (error) {
      return err(`Failed to setup demo: ${error}`);
    }
  }

  async updateOnboardingStatus(
    onboardingStatus: OnboardingStatus,
    name: string,
    hasOnboarded: boolean
  ): Promise<Result<string, string>> {
    const result = await dbExecute<{ id: string }>(
      `UPDATE organization 
       SET onboarding_status = COALESCE(onboarding_status, '{}'::jsonb) || $1::jsonb,
           name = COALESCE(NULLIF($2, ''), name),
           has_onboarded = CASE WHEN has_onboarded = true THEN true ELSE $3 END
       WHERE id = $4
       RETURNING id`,
      [onboardingStatus, name, hasOnboarded, this.organizationId]
    );

    if (result.error || !result.data || result.data.length === 0) {
      console.error("Failed to update onboarding status:", result.error);
      return err(result.error ?? "Failed to update onboarding status");
    }

    return ok(result.data[0].id);
  }
}
