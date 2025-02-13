import { dbQueryClickhouse } from "../db/dbExecute";
import { Result, resultMap } from "../../result";
import {
  buildFilterClickHouse,
  buildFilterWithAuthClickHouse,
} from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildUserSort,
  SortLeafUsers,
} from "../../../services/lib/sorts/users/sorts";
import { clickhousePriceCalc } from "../../../packages/cost";
import { UserMetric } from "./UserMetric";

export async function userMetrics(
  org_id: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafUsers,
  timeZoneDifference: number
): Promise<Result<UserMetric[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }
  const { argsAcc, orderByString } = buildUserSort(sort);
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id,
    argsAcc: argsAcc,
    filter,
  });

  const havingFilter = buildFilterClickHouse({
    filter,
    having: true,
    argsAcc: builtFilter.argsAcc,
  });

  const query = `
SELECT
  r.user_id as user_id,
  count(DISTINCT date_trunc('day', r.request_created_at)) as active_for,
  toDateTime(min(r.request_created_at) ${
    timeZoneDifference > 0
      ? `- INTERVAL '${Math.abs(timeZoneDifference)} minute'`
      : `+ INTERVAL '${timeZoneDifference} minute'`
  }) as first_active,
  toDateTime(max(r.request_created_at) ${
    timeZoneDifference > 0
      ? `- INTERVAL '${Math.abs(timeZoneDifference)} minute'`
      : `+ INTERVAL '${timeZoneDifference} minute'`
  }) as last_active,
  count(r.request_id)::Int32 as total_requests,
  count(r.request_id) / count(DISTINCT date_trunc('day', r.request_created_at)) as average_requests_per_day_active,
  (sum(r.prompt_tokens) + sum(r.completion_tokens)) / count(r.request_id) as average_tokens_per_request,
  sum(r.completion_tokens) as total_completion_tokens,
  sum(r.prompt_tokens) as total_prompt_token,
  (${clickhousePriceCalc("r")}) as cost,
  sum(CASE WHEN r.properties['Helicone-Rate-Limit-Status'] = 'rate_limited' THEN 1 ELSE 0 END) as rate_limited_count
from request_response_rmt r
WHERE (${builtFilter.filter})
GROUP BY r.user_id
HAVING (${havingFilter.filter})
ORDER BY ${orderByString}
LIMIT ${limit}
OFFSET ${offset}
  `;

  return resultMap(
    await dbQueryClickhouse<UserMetric>(query, havingFilter.argsAcc),
    (data) => {
      return data.map((d) => {
        return {
          ...d,
          first_active: new Date(
            new Date(d.first_active + "Z").getTime() +
              timeZoneDifference * 60 * 1000
          ).toISOString(),
          last_active: new Date(
            new Date(d.last_active + "Z").getTime() +
              timeZoneDifference * 60 * 1000
          ).toISOString(),
        };
      });
    }
  );
}

export async function userMetricsCount(
  org_id: string,
  filter: FilterNode
): Promise<Result<number, string>> {
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id,
    argsAcc: [],
    filter,
  });

  const query = `
SELECT
  count(DISTINCT r.user_id) as count
from request_response_rmt r
WHERE (${builtFilter.filter})
  `;
  const { data, error } = await dbQueryClickhouse<{ count: number }>(
    query,
    builtFilter.argsAcc
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data[0].count, error: null };
}
