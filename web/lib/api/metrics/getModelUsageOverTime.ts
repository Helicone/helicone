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
  sum_prompt_tokens: number;
  sum_completion_tokens: number;
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
  const builtFilter = buildFilter(filter, []);
  const dateTrunc = `DATE_TRUNC('${dbIncrement}', request.created_at + INTERVAL '${timeZoneDifference} minutes')`;
  const query = `
SELECT
  response.body ->> 'model'::text as model,
  ${dateTrunc} as created_at_trunc,
  sum(((response.body -> 'usage'::text) ->> 'total_tokens'::text)::bigint)::bigint AS sum_tokens,
  sum(((response.body -> 'usage'::text) ->> 'prompt_tokens'::text)::bigint)::bigint AS sum_prompt_tokens,
  sum(((response.body -> 'usage'::text) ->> 'completion_tokens'::text)::bigint)::bigint AS sum_completion_tokens
FROM response
  left join request on response.request = request.id
  left join user_api_keys on request.auth_hash = user_api_keys.api_key_hash
WHERE (
  user_api_keys.user_id = '${userId}'
  AND response.body ->> 'model'::text is not null
  AND (${builtFilter.filter})
)
GROUP BY response.body ->> 'model'::text, ${dateTrunc}
`;
  const { data, error } = await dbExecute<ModelUsageOverTime>(
    query,
    builtFilter.argsAcc
  );
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
      prompt_tokens: Number(d.sum_prompt_tokens),
      completion_tokens: Number(d.sum_completion_tokens),
    })),
    error: null,
  };
}
