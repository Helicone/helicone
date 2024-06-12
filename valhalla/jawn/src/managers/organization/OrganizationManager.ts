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

export class OrganizationManager extends BaseManager {
  async createOrganization(
    createOrgParams: NewOrganizationParams
  ): Promise<Result<NewOrganizationParams, string>> {
    if (createOrgParams.owner !== this.authParams.userId) {
      return err("Unauthorized");
    }

    if (createOrgParams.organization_type === "customer") {
      if (createOrgParams.org_provider_key !== "reseller") {
        return err("Unauthorized - only resellers can create customers");
      }
    }

    if (createOrgParams.tier !== "free") {
      return err("Unauthorized - only free tier is supported");
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
      return err("Unauthorized - only organization admins can update settings");
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
}
