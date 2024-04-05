import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database } from "../db/database.types";
import { ClickhouseWrapper } from "./ClickhouseWrapper";
import { PgWrapper } from "./PgWrapper";

export type Tier = "free" | "pro" | "growth" | "enterprise";
export type UsageEligibleOrgs = {
  id: string;
  stripe_subscription_item_id: string;
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
    const query = `select o.id, o.stripe_subscription_item_id
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

  // async getOrganizationsByTierAndUsage(
  //   tier: Tier,
  //   params: {
  //     isStripeCustomer?: boolean;
  //     recorded?: boolean;
  //     usageDate?: Date;
  //   }
  // ): Promise<
  //   Result<Database["public"]["Tables"]["organization"]["Row"][], string>
  // > {
  //   const { isStripeCustomer, recorded, usageDate } = params;

  //   const query = this.supabaseClient
  //     .from("organization")
  //     .select(
  //       `*,
  //       organization_usage!left(*)`
  //     )
  //     .eq("soft_delete", false)
  //     .eq("tier", tier);
  //   // 'country_id.eq.1,name.eq.Beijing'

  //   // if (recorded !== undefined) {
  //   //   query.or(`recorded.eq.${recorded},recorded.is.null`, {
  //   //     referencedTable: "organization_usage",
  //   //   });
  //   // }

  //   if (usageDate) {
  //     const usageDateStr = usageDate.toISOString().split("T")[0];

  //     query.or(
  //       `usage_date.is.null,and(usage_date.eq.${usageDateStr},recorded.eq.${recorded})`,
  //       { referencedTable: "organization_usage" } // Specify the table for the OR conditions
  //     );
  //   }

  //   if (isStripeCustomer) {
  //     query.not("stripe_customer_id", "is", null).neq("stripe_customer_id", "");
  //   }

  //   // if (usageDate) {
  //   //   const usageDateStr = usageDate.toISOString().split("T")[0];
  //   //   console.log(`Usage date: ${usageDateStr}`);

  //   //   query.or(`usage_date.is.null,usage_date.eq.${usageDateStr}`, {
  //   //     referencedTable: "organization_usage",
  //   //   });

  //   // query.eq(
  //   //   "organization_usage.usage_date",
  //   //   usageDate.toISOString().split("T")[0]
  //   // );
  //   // }

  //   console.log(`Query: ${JSON.stringify(query)}`);

  //   const { data, error } = await query;

  //   if (error) {
  //     return err(error.message);
  //   }

  //   return ok(data);
  // }

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
