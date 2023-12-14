import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

/**
 * Retrieves the total number of requests based on the provided filter, time filter, and organization ID.
 * @param filter - The filter node to apply to the requests.
 * @param timeFilter - The time range to filter the requests.
 * @param org_id - The ID of the organization.
 * @returns A promise that resolves to the total number of requests, or an error message if the request fails.
 */
export async function getTotalRequests(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string
): Promise<Result<number, string>> {
  const { filter: filterString, argsAcc } = await buildFilterWithAuthClickHouse(
    {
      org_id,
      filter: {
        left: timeFilterToFilterNode(timeFilter, "response_copy_v3"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    }
  );
  const query = `

  WITH total_count AS (
    SELECT count(*) as count
    FROM response_copy_v3
    WHERE (
      (${filterString})
    )
  )
  SELECT coalesce(sum(count), 0) as count
  FROM total_count
`;

  const res = await dbQueryClickhouse<{
    count: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => +d[0].count);
}
