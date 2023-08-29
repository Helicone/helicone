import { dbQueryClickhouse } from "../db/dbExecute";
import { Result, resultMap } from "../../result";
import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";

export async function getTotalFeedback(
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
        left: timeFilterToFilterNode(timeFilter, "feedback"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    },
    "feedback"
  );

  const query = `
      WITH total_count AS (
        SELECT count(*) as count
        FROM feedback
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
