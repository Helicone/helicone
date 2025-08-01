import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";

export type APIKey = {
  api_key_hash: string;
  organization_id: string;
};

export class APIKeysStore {
  constructor(private supabaseClient: SupabaseClient<Database>) {}

  async getAPIKeys(): Promise<APIKey[] | null> {
    const { data, error } = await this.supabaseClient
      .from("helicone_api_keys")
      .select("organization_id, api_key_hash")
      .eq("soft_delete", false);

    if (error) {
      return null;
    }

    return data;
  }

  async getAPIKeyWithFetch(apiKeyHash: string): Promise<APIKey | null> {
    const { data, error } = await this.supabaseClient
      .from("helicone_api_keys")
      .select("organization_id, api_key_hash")
      .eq("api_key_hash", apiKeyHash)
      .eq("soft_delete", false);

    if (error) {
      return null;
    }

    if (data.length === 0) {
      return null;
    }

    return data[0];
  }
}
