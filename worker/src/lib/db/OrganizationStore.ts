import { ClickhouseClientWrapper } from "./clickhouse";
import { SupabaseClient } from "@supabase/supabase-js";
import { Result } from "../../results";
import { Database } from "../../../supabase/database.types";

export type Tier = "free" | "pro" | "growth" | "enterprise";
export class OrganizationStore {
  constructor(
    private supabaseClient: SupabaseClient<Database>,
    private clickhouseClient: ClickhouseClientWrapper
  ) {}

  public async getOrgsByTier(
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
}
