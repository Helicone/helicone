import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilter,
  buildFilterWithAuth,
} from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbExecute } from "../db/dbExecute";

export interface Count {
  count: number;
}

export async function getRequestCount(
  filter: FilterNode,
  user_id: string,
  cached: boolean
): Promise<Result<number, string>> {
  console.log("GETTING REQUEST COUNT", cached);
  if (cached) {
    // TEMPORARILY DISABLED
    return { data: 0, error: null };
  }

  const { filter: filterString, argsAcc } = buildFilter(filter, []);
  const query = `
SELECT 
  COUNT(*) AS count
 FROM request
   LEFT JOIN response ON response.request = request.id
   LEFT JOIN user_api_keys ON user_api_keys.api_key_hash = request.auth_hash
  ${cached ? "inner join cache_hits ch ON ch.request_id = request.id" : ""}
WHERE (
  user_api_keys.user_id = '${user_id}'
  AND (${filterString})
)
`;

  const { data, error } = await dbExecute<Count>(query, argsAcc);

  if (error !== null) {
    return { data: null, error: error };
  }
  if (data.length === 0) {
    return { data: null, error: "No data getting last request" };
  }
  return { data: data[0].count, error: null };
}
