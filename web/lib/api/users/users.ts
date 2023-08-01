import { dbQueryClickhouse } from "../db/dbExecute";
import { Result } from "../../result";
import {
  buildFilterClickHouse,
  buildFilterWithAuthClickHouse,
} from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildUserSort,
  SortLeafUsers,
} from "../../../services/lib/sorts/users/sorts";
import { CLICKHOUSE_PRICE_CALC } from "../../sql/constants";

export interface UserMetric {
  user_id: string;
  active_for: number;
  first_active: Date;
  last_active: Date;
  total_requests: number;
  average_requests_per_day_active: number;
  average_tokens_per_request: number;
  cost: number;
}

export async function userMetrics(
  org_id: string,
  filter: FilterNode,
  offset: number,
  limit: number,
  sort: SortLeafUsers
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
  min(r.request_created_at) as first_active,
  max(r.request_created_at) as last_active,
  count(r.request_id)::Int32 as total_requests,
  count(r.request_id) / count(DISTINCT date_trunc('day', r.request_created_at)) as average_requests_per_day_active,
  (sum(r.prompt_tokens) + sum(r.completion_tokens)) / count(r.request_id) as average_tokens_per_request,
  sum(r.completion_tokens) as total_completion_tokens,
  sum(r.prompt_tokens) as total_prompt_token,
  (${CLICKHOUSE_PRICE_CALC("r")}) as cost
from response_copy_v3 r
WHERE (${builtFilter.filter})
GROUP BY r.user_id
HAVING (${havingFilter.filter})
ORDER BY ${orderByString}
LIMIT ${limit}
OFFSET ${offset}
  `;

  const { data, error } = await dbQueryClickhouse<UserMetric>(
    query,
    havingFilter.argsAcc
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
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
from response_copy_v3 r
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
