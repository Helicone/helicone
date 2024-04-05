import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database } from "../db/database.types";
import { ClickhouseWrapper } from "./ClickhouseWrapper";
import { PgWrapper } from "./PgWrapper";

export type Tier = "free" | "pro" | "growth" | "enterprise";
export type UsageEligibleOrgs = {
  orgId: string;
  stripeSubscriptionItemId: string;
};

export class OrganizationStore {
  constructor(
    private clickhouseClient: ClickhouseWrapper,
    private supabaseClient: SupabaseClient<Database>,
    private pg: PgWrapper
  ) {}

  async getUsageEligibleOrganizations(
    usageDate: string
  ): Promise<Result<UsageEligibleOrgs[], string>> {
    const query = `select o.id as orgId, o.stripe_subscription_item_id as stripeSubscriptionItemId
    from organization as o
    left join organization_usage as ou on o.id = ou.organization_id AND ou.usage_date = $1
    where o.tier = 'growth'
    and o.stripe_customer_id is not null
    and o.stripe_subscription_item_id is not null
    and o.soft_delete = false
    and (ou.id IS NULL OR (ou.usage_date = $1 AND ou.recorded = false))
    `;

    const { data: eligibleOrgs, error: eligibleOrgsErr } =
      await this.pg.dbExecute<UsageEligibleOrgs>(query, [usageDate]);

    if (eligibleOrgsErr || !eligibleOrgs) {
      return err(eligibleOrgsErr);
    }

    return ok(eligibleOrgs);
  }

  async getOrganizationsByTier(
    tier: Tier,
    params: {
      isStripeCustomer?: boolean;
      hasStripeSubscriptionItemId?: boolean;
    }
  ): Promise<
    Result<Database["public"]["Tables"]["organization"]["Row"][], string>
  > {
    const { isStripeCustomer } = params;
    const query = this.supabaseClient
      .from("organization")
      .select("*")
      .eq("soft_delete", false)
      .eq("tier", tier);

    if (isStripeCustomer) {
      query.not("stripe_customer_id", "is", null).neq("stripe_customer_id", "");
    }

    if (params.hasStripeSubscriptionItemId) {
      query
        .not("stripe_subscription_item_id", "is", null)
        .neq("stripe_subscription_item_id", "");
    }

    const { data, error } = await query;

    if (error) {
      return err(error.message);
    }

    return ok(data);
  }

  async getOrganizationUsageByOrgIdAndDate(
    orgId: string,
    usageDate: string
  ): Promise<
    Result<Database["public"]["Tables"]["organization_usage"]["Row"], string>
  > {
    const { data, error } = await this.supabaseClient
      .from("organization_usage")
      .select("*")
      .eq("organization_id", orgId)
      .eq("usage_date", usageDate);

    if (error) {
      return err(error.message);
    }

    if (!data) {
      return err("Organization usage not found.");
    }

    return ok(data[0]);
  }

  async upsertOrgUsage(
    usageData: Database["public"]["Tables"]["organization_usage"]["Insert"]
  ): Promise<Result<null, string>> {
    const { error } = await this.supabaseClient
      .from("organization_usage")
      .upsert(usageData, {
        ignoreDuplicates: false,
        onConflict: "organization_id, usage_date",
      });

    if (error) {
      console.log(`Failed to upsert organization usage: ${error.message}`);
      return err(error.message);
    }

    return ok(null);
  }
}
