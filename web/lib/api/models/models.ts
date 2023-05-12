import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterClickHouse,
  buildFilterWithAuthClickHouse,
} from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { CLICKHOUSE_PRICE_CALC } from "../../sql/constants";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface ModelMetric {
  model: string;
  total_requests: number;
  total_completion_tokens: number;
  total_prompt_token: number;
  total_tokens: number;
  cost: number;
}

export async function modelMetrics(
  orgId: string,
  filter: FilterNode,
  offset: number,
  limit: number
): Promise<Result<ModelMetric[], string>> {
  if (isNaN(offset) || isNaN(limit)) {
    return { data: null, error: "Invalid offset or limit" };
  }

  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id: orgId,
    argsAcc: [],
    filter,
  });

  const havingFilter = buildFilterClickHouse({
    filter,
    having: true,
    argsAcc: builtFilter.argsAcc,
  });
  const query = `
SELECT
  r.model as model,
  count(DISTINCT request_id) as total_requests,
  sum(r.completion_tokens) as total_completion_tokens,
  sum(r.prompt_tokens) as total_prompt_token,
  sum(r.prompt_tokens) + sum(r.completion_tokens) as total_tokens,
  (${CLICKHOUSE_PRICE_CALC}) as cost
from response_copy_v2 r
WHERE (${builtFilter.filter})
GROUP BY r.model
HAVING (${havingFilter.filter})
LIMIT ${limit}
OFFSET ${offset}
  `;

  const { data, error } = await dbQueryClickhouse<ModelMetric>(
    query,
    havingFilter.argsAcc
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
