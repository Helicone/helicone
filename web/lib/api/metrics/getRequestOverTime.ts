import { SupabaseClient, User } from "@supabase/supabase-js";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { buildFilter } from "../../../services/lib/filters/filters";

import { Result, unwrap } from "../../result";
import {
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { TimeIncrement } from "../../timeCalculations/fetchTimeData";
import { dbExecute } from "../db/dbExecute";

import { DataOverTimeRequest } from "./timeDataHandlerWrapper";

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

export async function getTotalRequestsOverTime({
  timeFilter,
  userFilter,
  userId,
  dbIncrement,
  timeZoneDifference,
}: DataOverTimeRequest): Promise<Result<DateCountDBModel[], string>> {
  const filter: FilterNode = {
    left: timeFilter,
    operator: "and",
    right: userFilter,
  };
  if (!isValidTimeIncrement(dbIncrement)) {
    return { data: null, error: "Invalid time increment" };
  }
  if (!isValidTimeZoneDifference(timeZoneDifference)) {
    return { data: null, error: "Invalid time zone difference" };
  }
  const dateTrunc = `DATE_TRUNC('${dbIncrement}', request.created_at + INTERVAL '${timeZoneDifference} minutes')`;
  const query = `
SELECT
  ${dateTrunc} as created_at_trunc,
  COUNT(*)::bigint as count
FROM request
   LEFT JOIN response ON response.request = request.id
   LEFT JOIN user_api_keys ON user_api_keys.api_key_hash = request.auth_hash
WHERE (
  user_api_keys.user_id = '${userId}'
  AND (${buildFilter(filter)})
)
GROUP BY ${dateTrunc}
ORDER BY created_at_trunc
`;

  const { data, error } = await dbExecute<DateCountDBModel>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return {
    data: data.map((d) => ({
      created_at_trunc: new Date(
        d.created_at_trunc.getTime() - timeZoneDifference * 60 * 1000
      ),
      count: Number(d.count),
    })),
    error: null,
  };
}
