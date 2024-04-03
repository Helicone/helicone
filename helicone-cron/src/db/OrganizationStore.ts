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

  async getOrgsByTier(
    tier: Tier,
    isStripeCustomer: boolean
  ): Promise<
    Result<Database["public"]["Tables"]["organization"]["Row"][], string>
  > {
    const query = this.supabaseClient
      .from("organization")
      .select("*")
      .eq("soft_delete", false)
      .eq("tier", tier);

    if (isStripeCustomer) {
      query.not("stripe_customer_id", "is", null).neq("stripe_customer_id", "");
    }

    const { data: orgs, error: orgsErr } = await query;

    if (orgsErr) {
      return { data: null, error: orgsErr.message };
    }

    return { data: orgs, error: null };
  }

  async getOrgUsageByOrgId(
    orgId: string,
    startDate: Date,
    endDate: Date
  ): Promise<
    Result<Database["public"]["Tables"]["organization_usage"]["Row"], string>
  > {
    const { data, error } = await this.supabaseClient
      .from("organization_usage")
      .select("*")
      .eq("org_id", orgId)
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    if (error) {
      return err(error.message);
    }

    return ok(data[0]);
  }

  async insertOrgUsage(
    usageData: Database["public"]["Tables"]["organization_usage"]["Insert"]
  ): Promise<Result<null, string>> {
    const { error } = await this.supabaseClient
      .from("organization_usage")
      .insert(usageData);

    if (error) {
      return err(error.message);
    }

    return ok(null);
  }
}
