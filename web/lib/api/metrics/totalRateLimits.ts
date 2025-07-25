import { FilterNode } from "@helicone-package/filters/filterDefs";
import { timeFilterToFilterNode } from "@helicone-package/filters/helpers";
import { buildFilterWithAuthClickHouseRateLimits } from "@helicone-package/filters/filters";
import { Result, resultMap } from "@/packages/common/result";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface TotalRateLimits {
  count: number;
}

export async function getTotalRateLimit(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string,
): Promise<Result<number, string>> {
  const { filter: filterString, argsAcc } =
    await buildFilterWithAuthClickHouseRateLimits({
      org_id,
      filter: {
        left: timeFilterToFilterNode(timeFilter, "rate_limit_log"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    });

  const query = `
    WITH total_count AS (
      SELECT count(*) as count
      FROM rate_limit_log
      WHERE (
        (${filterString})
      )
    )
    SELECT coalesce(sum(count), 0) as count
    FROM total_count
  `;

  return resultMap(
    await dbQueryClickhouse<{
      count: number;
    }>(query, argsAcc),
    (d) => +d[0].count,
  );
}
