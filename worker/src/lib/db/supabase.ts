import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { Result } from "../../results";

export class SupabaseWrapper {
  client: SupabaseClient<Database>;

  constructor(supbaseUrl: string, supabaseKey: string) {
    this.client = createClient<Database>(supbaseUrl, supabaseKey);
  }

  async getHeliconeApiKeyRow(
    heliconeApiKeyHash?: string
  ): Promise<
    Result<Database["public"]["Tables"]["helicone_api_keys"]["Row"], string>
  > {
    const { data, error } = await this.client
      .from("helicone_api_keys")
      .select("*")
      .eq("api_key_hash", heliconeApiKeyHash)
      .eq("soft_delete", false)
      .single();

    if (error !== null) {
      return { data: null, error: error.message };
    }
    return { data: data, error: null };
  }

  getOrg() {
    return this.client;
  }

  async insert(
    table: string,
    data: Database["public"]["Tables"][string]["Insert"][]
  ) {
    return await this.client.from(table).insert(data);
  }
}
