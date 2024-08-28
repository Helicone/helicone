import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHousePropertiesV2 } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getAverageLatency(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string
): Promise<Result<number, string>> {
  const { filter: filterString, argsAcc } =
    await buildFilterWithAuthClickHousePropertiesV2({
      org_id,
      filter: {
        left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    });
  const query = `
  WITH total_count AS (
    SELECT 
      count(*) as count,
      sum(request_response_rmt.latency) as total_latency
    FROM request_response_rmt
    ARRAY JOIN mapKeys(properties) AS key
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
