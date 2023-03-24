import { dbExecute } from "../db/dbExecute";
import { buildFilter } from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export interface ModelMetrics {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  sum_tokens: number;
}
export async function getModelMetrics(
  filter: FilterNode,
  user_id: string,
  cached: boolean
) {
  const builtFilter = buildFilter(filter, []);
  const query = `
SELECT response.body ->> 'model'::text as model,
  sum(((response.body -> 'usage'::text) ->> 'total_tokens'::text)::bigint)::bigint AS sum_tokens,
  sum(((response.body -> 'usage'::text) ->> 'prompt_tokens'::text)::bigint)::bigint AS prompt_tokens,
  sum(((response.body -> 'usage'::text) ->> 'completion_tokens'::text)::bigint)::bigint AS completion_tokens
FROM response 
  left join request on response.request = request.id
  left join user_api_keys on request.auth_hash = user_api_keys.api_key_hash
  ${cached ? "inner join cache_hits ch ON ch.request_id = request.id" : ""}
WHERE (
  user_api_keys.user_id = '${user_id}'
  AND (${builtFilter.filter})
)
GROUP BY response.body ->> 'model'::text;
    `;
  return dbExecute<ModelMetrics>(query, builtFilter.argsAcc);
}

export interface ModelMetricsUsers {
  model: string;
  sum_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  user_id: string;
}
export async function getModelMetricsForUsers(
  filter: FilterNode,
  user_id: string,
  cached: boolean,
  users: (string | null)[]
) {
  const containsNullUser = users.includes(null);
  const builtFilter = buildFilter(filter, []);
  const query = `
SELECT response.body ->> 'model'::text as model,
  sum(((response.body -> 'usage'::text) ->> 'total_tokens'::text)::bigint)::bigint AS sum_tokens,
  sum(((response.body -> 'usage'::text) ->> 'prompt_tokens'::text)::bigint)::bigint AS prompt_tokens,
  sum(((response.body -> 'usage'::text) ->> 'completion_tokens'::text)::bigint)::bigint AS completion_tokens,
  request.user_id
FROM response 
  left join request on response.request = request.id
  left join user_api_keys on request.auth_hash = user_api_keys.api_key_hash
  ${cached ? "inner join cache_hits ch ON ch.request_id = request.id" : ""}
WHERE (
  user_api_keys.user_id = '${user_id}'
  AND (
    request.user_id IN (${users
      .filter((u) => u !== null)
      .map((u) => `'${u}'`)
      .join(", ")})
    ${containsNullUser ? "OR request.user_id IS NULL" : ""}  
  )
  AND (${builtFilter.filter})
)
GROUP BY response.body ->> 'model'::text, request.user_id;
    `;
  return dbExecute<ModelMetricsUsers>(query, builtFilter.argsAcc);
}
