import { SupabaseClient, User } from "@supabase/supabase-js";

import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { Result } from "../../result";
import {
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { dbExecute } from "../db/dbExecute";
import { DataOverTimeRequest } from "./timeDataHandlerWrapper";
import { buildFilterWithAuth } from "../../../services/lib/filters/filters";

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

/**
 * Retrieves model usage over time based on the provided filters.
 * @param timeFilter - The time filter to apply.
 * @param userFilter - The user filter to apply.
 * @param orgId - The organization ID.
 * @param dbIncrement - The time increment for grouping the data.
 * @param timeZoneDifference - The time zone difference in minutes.
 * @returns A promise that resolves to a Result object containing the model usage data or an error message.
 */
export async function getModelUsageOverTime({
  timeFilter,
  userFilter,
  orgId,
  dbIncrement,
  timeZoneDifference,
}: DataOverTimeRequest): Promise<Result<ModelUsageOverTime[], string>> {
  const filter: FilterNode = userFilter;
  if (!isValidTimeIncrement(dbIncrement)) {
    return { data: null, error: "Invalid time increment" };
  }
  if (!isValidTimeZoneDifference(timeZoneDifference)) {
    return { data: null, error: "Invalid time zone difference" };
  }
  const builtFilter = await buildFilterWithAuth({
    filter,
    argsAcc: [],
    org_id: orgId,
  });
  const dateTrunc = `DATE_TRUNC('${dbIncrement}', request.created_at + INTERVAL '${timeZoneDifference} minutes')`;
  const query = `
SELECT
  response.body ->> 'model'::text as model,
  ${dateTrunc} as created_at_trunc,
  sum(response.completion_tokens + response.prompt_tokens) AS sum_tokens,
  sum(response.prompt_tokens) AS sum_prompt_tokens,
  sum(response.completion_tokens) AS sum_completion_tokens
FROM response
  left join request on response.request = request.id
WHERE (
  response.body ->> 'model'::text is not null
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
