import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getActiveUsers(
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
    SELECT 
        count(DISTINCT response_copy_v3.user_id) AS users
    FROM response_copy_v3
    WHERE (
        ${filterString}
    )
  `;

  const res = await dbQueryClickhouse<{
    users: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => +d[0].users);
}
