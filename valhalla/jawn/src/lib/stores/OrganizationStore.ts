import {
  NewOrganizationParams,
  OrganizationFilter,
  OrganizationLayout,
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
    type: "dashboard" | "requests";
    filters: OrganizationFilter[];
  }): Promise<Result<string, string>> {
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
    type: string
  ): Promise<Result<OrganizationLayout, string>> {
    const hasAccess = await this.checkAccessToMutateOrg(organizationId, userId);

    if (!hasAccess) {
      return err("User does not have access to get organization layout");
    }
    const { data: layout, error } = await supabaseServer.client
      .from("organization_layout")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("type", type)
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
