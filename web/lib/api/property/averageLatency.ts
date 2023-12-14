import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHousePropResponse } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

/**
 * Calculates the average latency for a given filter and time range.
 * @param filter - The filter node to apply.
 * @param timeFilter - The time range to filter the data.
 * @param org_id - The organization ID.
 * @returns A promise that resolves to the average latency as a number, or an error message as a string.
 */
export async function getAverageLatency(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string
): Promise<Result<number, string>> {
  const { filter: filterString, argsAcc } =
    await buildFilterWithAuthClickHousePropResponse({
      org_id,
      filter: {
        left: timeFilterToFilterNode(timeFilter, "property_with_response_v1"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    });
  const query = `
  WITH total_count AS (
    SELECT 
      count(*) as count,
      sum(property_with_response_v1.latency) as total_latency
    FROM property_with_response_v1
    WHERE (
      (${filterString})
    )
  )
  SELECT CASE
    WHEN count = 0 THEN 0
    ELSE total_latency / count
  END as average_latency
  FROM total_count
`;

  const res = await dbQueryClickhouse<{
    average_latency: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => +d[0].average_latency);
}
