import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../shared/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../shared/filters/filters";
import { Result, resultMap } from "../../shared/result";
import { CLICKHOUSE_PRICE_CALC } from "../../sql/constants";
import { dbExecute, dbQueryClickhouse } from "../../shared/db/dbExecute";

export async function getAverageLatency(
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
    SELECT 
      count(*) as count,
      sum(response_copy_v3.latency) as total_latency
    FROM response_copy_v3
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
