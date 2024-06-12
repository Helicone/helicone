import { supabaseServer } from "../../lib/db/supabase";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { ok, err, Result } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";

export type NewOrganizationParams = {
  name: string;
  owner: string;
  color: string;
  icon: string;
  has_onboarded: boolean;
  tier: string;
  reseller_id?: string;
  organization_type?: string;
  org_provider_key?: string;
  variant: "organization" | "reseller";
  limits?: {
    cost: number;
    requests: number;
  };
};

export type UpdateOrganizationParams = Pick<
  NewOrganizationParams,
  | "name"
  | "color"
  | "icon"
  | "variant"
  | "org_provider_key"
  | "limits"
  | "reseller_id"
  | "organization_type"
>;

export type FilterRow = {
  filterMapIdx: number;
  operatorIdx: number;
  value: string;
};

export type OrganizationFilter = {
  id: string;
  name: string;
  filter: FilterRow[];
  createdAt?: string;
  softDelete: boolean;
};

export class OrganizationManager extends BaseManager {
  async createOrganization(
    createOrgParams: NewOrganizationParams
  ): Promise<Result<NewOrganizationParams, string>> {
    if (createOrgParams.owner !== this.authParams.userId) {
      return err("Unauthorized");
    }

    if (createOrgParams.organization_type === "customer") {
      if (createOrgParams.org_provider_key !== "reseller") {
        return err("Only resellers can create customers");
      }
    }

    if (createOrgParams.tier !== "free") {
      return err("Only free tier is supported");
    }

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

  async updateOrganization(
    orgId: string,
    updateOrgParams: UpdateOrganizationParams
  ): Promise<Result<string, string>> {
    const orgMember = await dbExecute<{ org_role: string }>(
      "SELECT org_role FROM organization_member WHERE organization = $1 AND member = $2",
      [orgId, this.authParams.userId]
    );

    if (!orgMember.data || orgMember.data.length === 0) {
      return err("Unauthorized");
    }

    if (orgMember.data[0].org_role !== "owner") {
      return err("Only organization admins can update settings");
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
      .eq("id", orgId)
      .select("id");

    if (error || !data || data.length === 0) {
      console.error(`Failed to update organization: ${error}`);
      return err(`Failed to update organization: ${error}`);
    }
    return ok(data[0].id);
  }

  async addMember(
    organizationId: string,
    email: string
  ): Promise<Result<string, string>> {
    const getUserIdQuery = `
      SELECT id FROM auth.users WHERE email = $1 LIMIT 1
    `;
    let { data: userId, error: userIdError } = await dbExecute<{ id: string }>(
      getUserIdQuery,
      [email]
    );

    if (userIdError) {
      return err(userIdError);
    }
    if (!userId || userId.length === 0) {
      await supabaseServer.client.auth.signInWithOtp({ email });
      const result = await dbExecute<{ id: string }>(getUserIdQuery, [email]);
      userId = result.data;
      userIdError = result.error;
    }

    if (userIdError) {
      return err(userIdError);
    }

    const { error: insertError } = await supabaseServer.client
      .from("organization_member")
      .insert([{ organization: organizationId, member: userId![0].id }]);

    if (insertError && insertError !== null) {
      if (insertError.code === "23505") {
        return ok(userId![0].id); // User already added
      }
      return err(insertError.message);
    }

    return ok(userId![0].id);
  }

  async createFilter(
    organizationId: string,
    filters: OrganizationFilter[],
    type: "dashboard" | "requests"
  ): Promise<Result<string, string>> {
    const insertRequest = {
      organization_id: organizationId,
      type: type,
      filters: filters,
    };

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
}
