import { FilterNode } from "@helicone-package/filters/filterDefs";
import { timeFilterToFilterNode } from "@helicone-package/filters/helpers";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { Result, resultMap } from "@/packages/common/result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getTotalThreats(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string,
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
    },
  );
  const query = `
    SELECT 
        countIf(request_response_rmt.threat = true) AS threats
    FROM request_response_rmt
    WHERE (
        ${filterString}
    )
  `;

  const res = await dbQueryClickhouse<{
    threats: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => +d[0].threats);
}
