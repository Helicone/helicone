import { Result } from "../../result";
import { dbExecute } from "../db/dbExecute";
import { buildFilter, FilterNode } from "./filters";

export interface Count {
  count: number;
}
export async function getRequestCount(
  filter: FilterNode,
  user_id: string,
  cached: boolean
): Promise<Result<number, string>> {
  const query = `
SELECT 
  COUNT(*) AS count
 FROM request
   LEFT JOIN response ON response.request = request.id
   LEFT JOIN user_api_keys ON user_api_keys.api_key_hash = request.auth_hash
  ${cached ? "inner join cache_hits ch ON ch.request_id = request.id" : ""}
WHERE (
  user_api_keys.user_id = '${user_id}'
  AND (${buildFilter(filter)})
)
`;
  const { data, error } = await dbExecute<Count>(query);
  if (error !== null) {
    return { data: null, error: error };
  }
  if (data.length === 0) {
    return { data: null, error: "No data getting last request" };
  }
  return { data: data[0].count, error: null };
}
