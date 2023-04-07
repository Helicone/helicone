import { Result } from "../../result";
import { dbExecute } from "../db/dbExecute";
import { buildFilter } from "../../../services/lib/filters/filters";
import { FilterNode } from "../../../services/lib/filters/filterDefs";

export interface CreatedAt {
  created_at: number;
}
export async function getXRequestDate(
  filter: FilterNode,
  user_id: string,
  first: boolean
): Promise<Result<Date, string>> {
  const { filter: filterString, argsAcc } = buildFilter(filter, []);
  const query = `
SELECT 
  request.created_at
 FROM request
   LEFT JOIN response ON response.request = request.id
   LEFT JOIN user_api_keys ON user_api_keys.api_key_hash = request.auth_hash
WHERE (
  user_api_keys.user_id = '${user_id}'
  AND (${filterString})
)
ORDER BY response.created_at ${first ? "ASC" : "DESC"}
LIMIT 1
`;
  const { data, error } = await dbExecute<CreatedAt>(query, argsAcc);
  if (error !== null) {
    return { data: null, error: error };
  }
  if (data.length === 0) {
    return { data: null, error: "No data getting last request" };
  }
  return { data: new Date(data[0].created_at), error: null };
}
