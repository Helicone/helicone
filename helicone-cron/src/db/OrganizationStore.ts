import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database } from "../db/database.types";
import { ClickhouseWrapper } from "./ClickhouseWrapper";
import { PgWrapper } from "./PgWrapper";

export type Tier = "free" | "pro" | "growth" | "enterprise";
export type UsageEligibleOrgs = {
  orgId: string;
  stripeSubscriptionItemId: string;
  latestEndTime?: string;
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
    // const query = `select
    //   o.id as orgId,
    //   o.stripe_subscription_item_id as stripeSubscriptionItemId
    // from organization as o
    // left join organization_usage as ou on o.id = ou.organization_id AND ou.usage_date = $1
    //   where o.tier = 'growth'
    //   and o.stripe_customer_id is not null
    //   and o.stripe_subscription_item_id is not null
    //   and o.soft_delete = false
    //   and (ou.id IS NULL OR (ou.usage_date = $1 AND ou.recorded = false))
    // `;

    const query = `select
      o.id as orgId,
      o.stripe_subscription_item_id as stripeSubscriptionItemId,
      MAX(ou.end_time) as latestEndTime
    from organization as o
    left join organization_usage as ou on o.id = ou.organization_id
      where o.tier = 'growth'
      and o.stripe_customer_id is not null
      and o.stripe_subscription_item_id is not null
      and o.soft_delete = false
      and (ou.recorded = true OR ou.recorded IS NULL)
    group by o.id`;

    const { data: eligibleOrgs, error: eligibleOrgsErr } =
      await this.pg.dbExecute<UsageEligibleOrgs>(query, [usageDate]);

    if (eligibleOrgsErr || !eligibleOrgs) {
      return err(eligibleOrgsErr);
    }

    return ok(eligibleOrgs);
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
      return err(error.message);
    }

    return ok(null);
  }
}
