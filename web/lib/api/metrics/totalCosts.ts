import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../shared/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../shared/filters/filters";
import { Result, resultMap } from "../../shared/result";
import { CLICKHOUSE_PRICE_CALC } from "../../sql/constants";
import { dbExecute, dbQueryClickhouse } from "../../shared/db/dbExecute";

export interface TotalCost {
  cost: number;
}

export async function getTotalCost(
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

  WITH total_cost AS (
    SELECT ${CLICKHOUSE_PRICE_CALC("response_copy_v3")} as cost
    FROM response_copy_v3
    WHERE (
      (${filterString})
    )
  )
  SELECT coalesce(sum(cost), 0) as cost
  FROM total_cost
`;

  const res = await dbQueryClickhouse<TotalCost>(query, argsAcc);

  return resultMap(res, (d) => d[0].cost);
}
