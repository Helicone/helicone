import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuth } from "../../../services/lib/filters/filters";
import { dbExecute } from "../db/dbExecute";
import { resultMap } from "../../result";

export interface ModelMetrics {
  model: string;
  sum_prompt_tokens: number;
  sum_completion_tokens: number;
  sum_tokens: number;
}

export async function getModelMetrics(
  filter: FilterNode,
  org_id: string,
  cached: boolean
) {
  if (cached) {
    // TEMPORARILY DISABLED
    return {
      data: [],
      error: null,
    };
  }
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
FROM response 
  left join request on response.request = request.id
 ${cached ? "inner join cache_hits ch ON ch.request_id = request.id" : ""}
WHERE (
  (${builtFilter.filter})
)
GROUP BY response.body ->> 'model'::text;
    `;
  return resultMap(
    await dbExecute<ModelMetrics>(query, builtFilter.argsAcc),
    (data) => {
      return data.map((d) => {
        return {
          ...d,
          sum_tokens: +d.sum_tokens,
          sum_prompt_tokens: +d.sum_prompt_tokens,
          sum_completion_tokens: +d.sum_completion_tokens,
        };
      });
    }
  );
}

export interface ModelMetricsUsers {
  model: string;
  sum_tokens: number;
  sum_prompt_tokens: number;
  sum_completion_tokens: number;
  user_id: string;
}

export async function getModelMetricsForUsers(
  filter: FilterNode,
  org_id: string,
  users: (string | null)[]
) {
  const containsNullUser = users.includes(null);

  const builtFilter = await buildFilterWithAuth({
    org_id,
    filter,
    argsAcc: [],
  });
  const userList = users
    .filter((u) => u !== null)
    .map((u) => `'${u}'`)
    .join(", ");
  const query = `
SELECT response.body ->> 'model'::text as model,
  sum(response.completion_tokens + response.prompt_tokens) AS sum_tokens,
  sum(response.prompt_tokens) AS sum_prompt_tokens,
  sum(response.completion_tokens) AS sum_completion_tokens,
  request.user_id
FROM response 
  left join request on response.request = request.id
WHERE (
  (
    request.user_id IN (${userList})
    ${containsNullUser ? "OR request.user_id IS NULL" : ""}  
  )
  AND (${builtFilter.filter})
)
GROUP BY response.body ->> 'model'::text, request.user_id;
    `;
  return dbExecute<ModelMetricsUsers>(query, builtFilter.argsAcc);
}
