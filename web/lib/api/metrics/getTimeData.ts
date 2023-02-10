import { SupabaseClient, User } from "@supabase/supabase-js";

import { Result } from "../../result";
import { TimeIncrement } from "../../timeCalculations/fetchTimeData";
import { dbExecute } from "../db/dbExecute";
import { buildFilter, FilterNode } from "./filters";

export interface GetTimeDataOptions {
  filter: FilterNode;
  dbIncrement: TimeIncrement;
}

export interface AuthClient {
  client: SupabaseClient;
  user: User;
}

export interface DateCountDBModel {
  created_at_trunc: Date;
  count: number;
}

export async function getTimeData(
  filter: FilterNode,
  user_id: string,
  time_increment: TimeIncrement
): Promise<Result<DateCountDBModel[], string>> {
  const validIncrements = ["min", "hour", "day", "week", "month", "year"];
  if (!validIncrements.includes(time_increment)) {
    return { data: null, error: "Invalid time increment" };
  }

  const query = `
SELECT
  DATE_TRUNC('${time_increment}', request.created_at) as created_at_trunc,
  COUNT(*)::bigint as count
FROM  request
   LEFT JOIN response ON response.request = request.id
   LEFT JOIN user_api_keys ON user_api_keys.api_key_hash = request.auth_hash
WHERE (
  user_api_keys.user_id = '${user_id}'
  AND (${buildFilter(filter)})
)
GROUP BY DATE_TRUNC('${time_increment}', request.created_at)
ORDER BY created_at_trunc
`;

  const { data, error } = await dbExecute<DateCountDBModel>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return {
    data: data.map((d) => ({ ...d, count: Number(d.count) })),
    error: null,
  };
}
