import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
} from "../../../services/lib/filters/filters";
import {
  SortLeafRequest,
  buildRequestSort,
} from "../../../services/lib/sorts/requests/sorts";
import { Json } from "../../../supabase/database.types";
import { Result, resultMap } from "../../result";
import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";
import { ModelMetrics } from "../metrics/modelMetrics";

export async function getCacheCount(
  orgId: string,
  filter: FilterNode
): Promise<Result<number, string>> {
  const builtFilter = await buildFilterWithAuth({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `
  select count(*) as count from cache_hits
  left join request ON cache_hits.request_id = request.id
  WHERE (
    (${builtFilter.filter})
  )
`;
  return resultMap(
    await dbExecute<{
      count: number;
    }>(query, builtFilter.argsAcc),
    (x) => x[0].count
  );
}

export async function getModelMetrics(org_id: string, filter: FilterNode) {
  const builtFilter = await buildFilterWithAuth({
    org_id,
    argsAcc: [],
    filter,
  });
  const query = `
SELECT response.body ->> 'model'::text as model,
  sum(response.completion_tokens + response.prompt_tokens) AS sum_tokens,
  sum(response.prompt_tokens) AS sum_prompt_tokens,
  sum(response.completion_tokens) AS sum_completion_tokens
FROM cache_hits
  left join request on cache_hits.request_id = request.id
  left join response on request.id = response.request
WHERE (
  (${builtFilter.filter})
)
GROUP BY response.body ->> 'model'::text;
    `;
  return dbExecute<ModelMetrics>(query, builtFilter.argsAcc);
}
