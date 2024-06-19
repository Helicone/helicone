import {
  NewOrganizationParams,
  OrganizationFilter,
  OrganizationLayout,
  OrganizationMember,
  OrganizationOwner,
  UpdateOrganizationParams,
} from "../../managers/organization/OrganizationManager";
import { supabaseServer } from "../db/supabase";
import { dbExecute } from "../shared/db/dbExecute";
import { err, ok, Result } from "../shared/result";
import { BaseStore } from "./baseStore";

export class OrganizationStore extends BaseStore {
  async createNewOrganization(
    createOrgParams: NewOrganizationParams
  ): Promise<Result<NewOrganizationParams, string>> {
    const insert = await dbExecute<NewOrganizationParams>(
      "INSERT INTO organization (name, owner, color, icon, has_onboarded, tier, reseller_id, organization_type, org_provider_key, limits) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
      [
        createOrgParams.name,
        createOrgParams.owner,
        createOrgParams.color,
        createOrgParams.icon,
        createOrgParams.has_onboarded,
        createOrgParams.tier,
        createOrgParams.reseller_id,
        createOrgParams.organization_type,
        createOrgParams.org_provider_key,
        createOrgParams.limits,
      ]
    );

    if (insert.error || !insert.data) {
      return err(insert.error);
    }
    return ok(insert.data[0]);
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
    organizationId: string,
    userId: string
  ): Promise<Result<string, string>> {
    const hasAccess = await this.checkAccessToMutateOrg(organizationId, userId);
    if (!hasAccess) {
      return err("User does not have access to update organization");
    }
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

  async getUserByEmail(email: string): Promise<Result<string, string>> {
    const getUserIdQuery = `
      SELECT id FROM auth.users WHERE email = $1 LIMIT 1
    `;
    let { data: userId, error: userIdError } = await dbExecute<{ id: string }>(
      getUserIdQuery,
      [email]
    );

    if (userIdError || !userId || userId.length === 0) {
      return err(userIdError ?? "User not found");
    }
    return ok(userId[0].id);
  }

  async addMemberToOrganization(
    userId: string,
    organizationId: string
  ): Promise<Result<string, string>> {
    if ((await this.checkUserBelongsToOrg(organizationId, userId)) === false) {
      return err("User does not have access to add member to organization");
    }

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

  async createOrganizationFilter(
    insertRequest: {
      organization_id: string;
      type: "dashboard" | "requests";
      filters: OrganizationFilter[];
    },
    userId: string
  ): Promise<Result<string, string>> {
    const hasAccess = await this.checkUserBelongsToOrg(
      insertRequest.organization_id,
      userId
    );
    if (!hasAccess) {
      return err("User does not have access to create organization filter");
    }
    const insert = await supabaseServer.client
      .from("organization_layout")
      .insert([insertRequest])
      .select("*")
      .single();

    if (insert.error || !insert.data) {
      console.error(`Failed to create filter: ${insert.error}`);
      return err(`Failed to create filter: ${insert.error}`);
    }
    return ok(insert.data.id);
  }

  async deleteOrganization(userId: string): Promise<Result<string, string>> {
    const hasAccess = await this.checkAccessToMutateOrg(
      this.organizationId,
      userId
    );

    if (!hasAccess) {
      return err("User does not have access to delete organization");
    }

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
    userId: string,
    filterType: string
  ): Promise<Result<OrganizationLayout, string>> {
    const hasAccess = await this.checkUserBelongsToOrg(organizationId, userId);

    if (!hasAccess) {
      return err("User does not have access to get organization layout");
    }
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
    userId: string,
    type: string,
    filters: OrganizationFilter[]
  ): Promise<Result<string, string>> {
    const hasAccess = await this.checkUserBelongsToOrg(organizationId, userId);
    if (!hasAccess) {
      return err("User does not have access to update organization filter");
    }
    const updateRes = await supabaseServer.client
      .from("organization_layout")
      .update({
        filters: filters,
      })
      .eq("organization_id", organizationId)
      .eq("type", type);

    if (updateRes.error) {
      return err("internal error" + updateRes.error);
    }
    return ok("success");
  }

  async getOrganizationMembers(
    organizationId: string,
    userId: string
  ): Promise<Result<OrganizationMember[], string>> {
    const hasAccess = await this.checkUserBelongsToOrg(organizationId, userId);

    if (!hasAccess) {
      return err("User does not have access to get organization members");
    }

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
    memberId: string,
    userId: string
  ): Promise<Result<null, string>> {
    if (!organizationId) {
      return err("Invalid OrgId");
    }
    if (!memberId) {
      return err("Invalid MemberId");
    }
    const hasAccess = await this.checkAccessToMutateOrg(organizationId, userId);
    if (!hasAccess) {
      return err(
        "User does not have access to remove member from organization"
      );
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
    const hasAccess = await this.checkUserBelongsToOrg(organizationId, userId);
    if (!hasAccess) {
      return err("User does not have access to update organization member");
    }

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

  private async checkAccessToMutateOrg(
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

  private async checkUserBelongsToOrg(
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
}
