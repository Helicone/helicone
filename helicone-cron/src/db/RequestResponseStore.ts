import { SupabaseClient } from "@supabase/supabase-js";
import { Result, err, ok } from "../util/results";
import { ClickhouseWrapper } from "./ClickhouseWrapper";
import { Database } from "../db/database.types";

export type Tier = "free" | "pro" | "growth" | "enterprise";

export class RequestResponseStore {
  constructor(
    private clickhouseClient: ClickhouseWrapper,
    private supabaseClient: SupabaseClient<Database>
  ) {}

  async getRequestCountByOrgId(
    orgId: string,
    fromExclusive: Date,
    toInclusive: Date
  ): Promise<Result<number, string>> {
    const query = `SELECT
      COUNT() AS count
    FROM request_response_rmt
    WHERE 
      organization_id = {val_0: UUID} AND
      request_created_at > {val_1: DateTime} AND
      request_created_at <= {val_2: DateTime}
    `;

    const { data, error } = await this.clickhouseClient.dbQuery<{
      count: number;
    }>(query, [orgId, fromExclusive, toInclusive]);

    if (error) {
      return err(error);
    }

    if (!data || data.length === 0 || !data[0].count) {
      return err(`Failed to retrieve request count for org id: ${orgId}`);
    }

    return ok(data[0].count);
  }
}
