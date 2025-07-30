import { FilterNode } from "@helicone-package/filters/filterDefs";
import { timeFilterToFilterNode } from "@helicone-package/filters/helpers";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { Result, resultMap } from "@/packages/common/result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getActiveUsers(
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
        count(DISTINCT request_response_rmt.user_id) AS users
    FROM request_response_rmt
    WHERE (
        ${filterString}
    )
  `;

  const res = await dbQueryClickhouse<{
    users: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => +d[0].users);
}
