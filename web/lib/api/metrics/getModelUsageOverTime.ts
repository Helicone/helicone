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

export interface ModelUsageOverTime {
  created_at_trunc: Date;
  sum_tokens: number;
  model: string;
}

export async function getModelUsageOverTime({
  timeFilter,
  userFilter,
  userId,
  dbIncrement,
  timeZoneDifference,
}: DataOverTimeRequest): Promise<Result<ModelUsageOverTime[], string>> {
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
  response.body ->> 'model'::text as model,
  ${dateTrunc} as created_at_trunc,
  sum(((response.body -> 'usage'::text) ->> 'total_tokens'::text)::bigint)::bigint AS sum_tokens
FROM response
  left join request on response.request = request.id
  left join user_api_keys on request.auth_hash = user_api_keys.api_key_hash
WHERE (
  user_api_keys.user_id = '${userId}'
  AND response.body ->> 'model'::text is not null
  AND (${buildFilter(filter)})
)
GROUP BY response.body ->> 'model'::text, ${dateTrunc}
`;
  const { data, error } = await dbExecute<ModelUsageOverTime>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  return {
    data: data.map((d) => ({
      ...d,
      created_at_trunc: new Date(
        d.created_at_trunc.getTime() - timeZoneDifference * 60 * 1000
      ),
      sum_tokens: Number(d.sum_tokens),
    })),
    error: null,
  };
}
