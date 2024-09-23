import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database } from "../db/database.types";
import { ClickhouseWrapper } from "./ClickhouseWrapper";
import { PgWrapper } from "./PgWrapper";

export type Tier = "free" | "pro" | "growth" | "enterprise";
export interface UsageEligibleOrgs {
  orgId: string;
  stripeSubscriptionId: string;
  stripeSubscriptionItemId: string;
  latestEndTime?: string;
}

export class OrganizationStore {
  constructor(
    private clickhouseClient: ClickhouseWrapper,
    private supabaseClient: SupabaseClient<Database>,
    private pg: PgWrapper
  ) {}

  async getUsageEligibleOrganizations(): Promise<
    Result<UsageEligibleOrgs[], string>
  > {
    const query = `SELECT
      o.id as "orgId",
      o.stripe_subscription_id as "stripeSubscriptionId",
      o.stripe_subscription_item_id as "stripeSubscriptionItemId",
      MAX(ou.end_date) as "latestEndTime"
    from organization as o
    left join organization_usage as ou on o.id = ou.organization_id
      where o.tier = 'growth'
      OR o.tier = 'pro-20240913'
      and o.subscription_status = 'active'
      and o.stripe_customer_id is not null
      and o.stripe_subscription_item_id is not null
      and o.soft_delete = false
      and (ou.recorded = true OR ou.recorded IS NULL)
    group by o.id`;

    const { data: eligibleOrgs, error: eligibleOrgsErr } =
      await this.pg.dbExecute<UsageEligibleOrgs>(query, []);

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
      .upsert(usageData);

    if (error) {
      return err(error.message);
    }

    return ok(null);
  }
}
