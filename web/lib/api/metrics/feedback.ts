import { dbQueryClickhouse } from "../db/dbExecute";
import { Result, resultMap } from "@/packages/common/result";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { timeFilterToFilterNode } from "@helicone-package/filters/helpers";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";

export async function getTotalFeedback(
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
      WITH total_count AS (
        SELECT count(*) as count
        FROM request_response_rmt
        WHERE (
          (${filterString})
          AND rating IS NOT NULL
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
