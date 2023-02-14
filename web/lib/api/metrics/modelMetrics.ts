import { dbExecute } from "../db/dbExecute";
import { buildFilter, FilterNode } from "./filters";

export interface ModelMetrics {
  model: string;
  sum_tokens: number;
}
export async function getModelMetrics(filter: FilterNode, user_id: string) {
  const query = `
SELECT response.body ->> 'model'::text as model,
  sum(((response.body -> 'usage'::text) ->> 'total_tokens'::text)::bigint)::bigint AS sum_tokens
FROM response 
  left join request on response.request = request.id
  left join user_api_keys on request.auth_hash = user_api_keys.api_key_hash
WHERE (
  user_api_keys.user_id = '${user_id}'
  AND (${buildFilter(filter)})
)
GROUP BY response.body ->> 'model'::text;
    `;
  return dbExecute<ModelMetrics>(query);
}
