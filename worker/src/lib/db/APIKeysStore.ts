import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";

export type APIKey = {
  api_key_hash: string;
  organization_id: string;
  soft_delete: boolean;
};

export class APIKeysStore {
  constructor(private supabaseClient: SupabaseClient<Database>) {}

  async getAPIKeys(): Promise<APIKey[] | null> {
    const pageSize = 1000;
    const allData: APIKey[] = [];
    let offset = 0;

    while (true) {
      const ONE_DAY_AGO = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const { data, error } = await this.supabaseClient
        .from("helicone_api_keys")
        .select("organization_id, api_key_hash, soft_delete")
        .eq("temp_key", false)
        .neq("api_key_name", "auto-generated-experiment-key")
        .or(`created_at.gte.${ONE_DAY_AGO},updated_at.gte.${ONE_DAY_AGO}`)
        .range(offset, offset + pageSize - 1);

      if (error) {
        return null;
      }

      if (!data || data.length === 0) {
        break;
      }

      allData.push(...data);

      // If we got fewer results than the page size, we've reached the end
      if (data.length < pageSize) {
        break;
      }

      offset += pageSize;
    }

    return allData;
  }
}
