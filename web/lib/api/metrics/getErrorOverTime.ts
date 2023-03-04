import { SupabaseClient, User } from "@supabase/supabase-js";

import { Result } from "../../result";
import {
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { dbExecute } from "../db/dbExecute";
import { buildFilter } from "../../../services/lib/filters/filters";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export interface AuthClient {
  client: SupabaseClient;
  user: User;
}

export interface ErrorCountOverTime {
  created_at_trunc: Date;
  count: number;
}

export async function getErrorOverTime({
  timeFilter,
  userFilter,
  userId,
  dbIncrement,
  timeZoneDifference,
}: DataOverTimeRequest): Promise<Result<ErrorCountOverTime[], string>> {
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
  count(*) as count
FROM response
  left join request on response.request = request.id
  left join user_api_keys on request.auth_hash = user_api_keys.api_key_hash
WHERE (
  user_api_keys.user_id = '${userId}'
  AND response.body ->>'error' is not null
  AND (${buildFilter(filter)})
)
GROUP BY ${dateTrunc}
`;
  const { data, error } = await dbExecute<ErrorCountOverTime>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return {
    data: data.map((d) => ({
      ...d,
      created_at_trunc: new Date(
        d.created_at_trunc.getTime() - timeZoneDifference * 60 * 1000
      ),
      count: Number(d.count),
    })),
    error: null,
  };
}
