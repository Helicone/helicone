import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getTotalThreats(
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
        left: timeFilterToFilterNode(timeFilter, "request_response_versioned"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    }
  );
  const query = `
    SELECT 
        count(request_response_versioned.threat) AS threats
    FROM request_response_versioned
    WHERE (
        ${filterString}
    )
  `;

  const res = await dbQueryClickhouse<{
    threats: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => +d[0].threats);
}
