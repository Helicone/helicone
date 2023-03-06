import { dbExecute } from "../db/dbExecute";
import { buildFilter } from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export interface ModelMetrics {
  model: string;
  sum_tokens: number;
}
export async function getModelMetrics(
  filter: FilterNode,
  user_id: string,
  cached: boolean
) {
  const query = `
SELECT response.body ->> 'model'::text as model,
  sum(((response.body -> 'usage'::text) ->> 'total_tokens'::text)::bigint)::bigint AS sum_tokens
FROM response 
  left join request on response.request = request.id
  left join user_api_keys on request.auth_hash = user_api_keys.api_key_hash
  ${cached ? "inner join cache_hits ch ON ch.request_id = request.id" : ""}
WHERE (
  user_api_keys.user_id = '${user_id}'
  AND (${buildFilter(filter)})
)
GROUP BY response.body ->> 'model'::text;
    `;
  return dbExecute<ModelMetrics>(query);
}

export interface ModelMetricsUsers {
  model: string;
  sum_tokens: number;
  user_id: string;
}
export async function getModelMetricsForUsers(
  filter: FilterNode,
  user_id: string,
  cached: boolean,
  users: (string | null)[]
) {
  const containsNullUser = users.includes(null);
  const query = `
SELECT response.body ->> 'model'::text as model,
  sum(((response.body -> 'usage'::text) ->> 'total_tokens'::text)::bigint)::bigint AS sum_tokens,
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
  AND (${buildFilter(filter)})
)
GROUP BY response.body ->> 'model'::text, request.user_id;
    `;
  return dbExecute<ModelMetricsUsers>(query);
}
