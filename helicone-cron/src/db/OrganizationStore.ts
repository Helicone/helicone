import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { Database } from "../db/database.types";
import { ClickhouseWrapper } from "./ClickhouseWrapper";

export type Tier = "free" | "pro" | "growth" | "enterprise";

export class OrganizationStore {
  constructor(
    private clickhouseClient: ClickhouseWrapper,
    private supabaseClient: SupabaseClient<Database>
  ) {}

  async getOrganizationsByTierAndUsage(
    tier: Tier,
    params: {
      isStripeCustomer?: boolean;
      recorded?: boolean;
      usageDate?: Date;
    }
  ): Promise<
    Result<Database["public"]["Tables"]["organization"]["Row"][], string>
  > {
    const { isStripeCustomer, recorded, usageDate } = params;

    const query = this.supabaseClient
      .from("organization")
      .select(
        `*, 
      organization_usage!inner(organization_id)`
      )
      .eq("soft_delete", false)
      .eq("tier", tier);

    if (recorded !== undefined) {
      query.eq("organization_usage.recorded", recorded);
    }

    if (isStripeCustomer) {
      query.not("stripe_customer_id", "is", null).neq("stripe_customer_id", "");
    }

    if (usageDate) {
      query.eq("organization_usage.usage_date", usageDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      return err(error.message);
    }

    return ok(data);
  }

  async upsertOrgUsage(
    usageData: Database["public"]["Tables"]["organization_usage"]["Insert"]
  ): Promise<Result<null, string>> {
    const { error } = await this.supabaseClient
      .from("organization_usage")
      .upsert(usageData, {
        ignoreDuplicates: false,
        onConflict: "org_id, usage_date",
      });

    if (error) {
      return err(error.message);
    }

    return ok(null);
  }
}
