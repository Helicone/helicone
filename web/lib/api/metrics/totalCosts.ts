import { clickhousePriceCalc } from "../../../packages/cost";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { timeFilterToFilterNode } from "@/services/lib/filters/helpers/filterFunctions";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface TotalCost {
  cost: number;
  count: number;
}

export async function getTotalCost(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string
): Promise<
  Result<
    {
      cost: number;
      count: number;
    },
    string
  >
> {
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

  WITH total_cost AS (
    SELECT ${clickhousePriceCalc("request_response_rmt")} as cost
    FROM request_response_rmt
    WHERE (
      (${filterString})
    )
  )
  SELECT coalesce(sum(cost), 0) as cost,
  (
    SELECT count(*) as count
    FROM request_response_rmt
    WHERE (
      (${filterString})
    )
  ) as count
  FROM total_cost
`;

  const res = await dbQueryClickhouse<TotalCost>(query, argsAcc);

  return resultMap(res, (d) => ({ cost: d[0].cost, count: d[0].count }));
}
