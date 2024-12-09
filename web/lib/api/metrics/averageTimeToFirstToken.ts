import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { timeFilterToFilterNode } from "@/services/lib/filters/helpers/filterFunctions";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getAverageTimeToFirstToken(
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
        left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
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
      sum(request_response_rmt.time_to_first_token) as total_time_to_first_token
    FROM request_response_rmt
    WHERE (
      (${filterString} and request_response_rmt.time_to_first_token > 0)
    )
  )
  SELECT CASE
    WHEN count = 0 THEN 0
    ELSE total_time_to_first_token / count
  END as average_time_to_first_token
  FROM total_count
`;

  const res = await dbQueryClickhouse<{
    average_time_to_first_token: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => +d[0].average_time_to_first_token);
}
