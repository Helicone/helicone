import { SupabaseClient } from "@supabase/supabase-js";
import { Result } from "../util/results";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { Database } from "../db/database.types";

export type Tier = "free" | "pro" | "growth" | "enterprise";

export class RequestResponseStore {
  constructor(
    private clickhouseClient: ClickhouseClientWrapper,
    private supabaseClient: SupabaseClient<Database>
  ) {}

  async getRequestCountByOrgId(
    orgId: string,
    from: Date,
    to: Date
  ): Promise<Result<number, string>> {
    const query = `SELECT
      COUNT() AS count
    FROM request_response_log
    WHERE 
      organization_id = {val_0: UUID} AND
      request_created_at >= {val_1: String} AND
      request_created_at <= {val_2: String}
    `;

    const { data, error } = await this.clickhouseClient.dbQuery<number>(query, [
      orgId,
      from.toISOString(),
      to.toISOString(),
    ]);

    if (error) {
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return {
        data: null,
        error: `Failed to retrieve request count for org id: ${orgId}`,
      };
    }

    return { data: data[0], error: null };
  }
}
