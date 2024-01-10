import { FilterNode } from "../../shared/filters/filterDefs";
import { buildFilterWithAuth } from "../../shared/filters/filters";
import { Result } from "../../shared/result";
import { dbExecute } from "../../shared/db/dbExecute";

export interface Count {
  count: number;
}

export async function getRequestCount(
  filter: FilterNode,
  org_id: string,
  cached: boolean
): Promise<Result<number, string>> {
  if (cached) {
    // TEMPORARILY DISABLED
    return { data: 0, error: null };
  }

  const { filter: filterString, argsAcc } = await buildFilterWithAuth({
    org_id,
    filter,
    argsAcc: [],
  });
  const query = `
SELECT 
  COUNT(*) AS count
 FROM request
   LEFT JOIN response ON response.request = request.id
  ${cached ? "inner join cache_hits ch ON ch.request_id = request.id" : ""}
WHERE (
  
  (${filterString})
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
