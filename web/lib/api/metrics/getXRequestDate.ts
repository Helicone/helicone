import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuth } from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbExecute } from "../db/dbExecute";

export interface CreatedAt {
  created_at: number;
}

/**
 * Retrieves the date of the first or last request that matches the given filter.
 * @param filter - The filter node to apply to the query.
 * @param org_id - The ID of the organization.
 * @param first - Determines whether to retrieve the date of the first request (true) or the last request (false).
 * @returns A promise that resolves to a Result object containing the date of the request or an error message.
 */
export async function getXRequestDate(
  filter: FilterNode,
  org_id: string,
  first: boolean
): Promise<Result<Date, string>> {
  const { filter: filterString, argsAcc } = await buildFilterWithAuth({
    filter,
    argsAcc: [],
    org_id,
  });
  const query = `
SELECT 
  request.created_at
 FROM request
   LEFT JOIN response ON response.request = request.id
WHERE (
  (${filterString})
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
