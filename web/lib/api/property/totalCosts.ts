import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuthClickHouse,
  buildFilterWithAuthClickHousePropResponse,
} from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { CLICKHOUSE_PRICE_CALC } from "../../sql/constants";
import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";

export interface TotalCost {
  cost: number;
}

export async function getTotalCostRaw(
  filter: FilterNode,
  org_id: string
): Promise<Result<number, string>> {
  const { filter: filterString, argsAcc } =
    await buildFilterWithAuthClickHousePropResponse({
      org_id,
      filter: filter,
      argsAcc: [],
    });
  const query = `
  WITH total_cost AS (
    SELECT ${CLICKHOUSE_PRICE_CALC("property_with_response_v1")} as cost
    FROM property_with_response_v1
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

export async function getTotalCost(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string
): Promise<Result<number, string>> {
  return getTotalCostRaw(
    {
      left: timeFilterToFilterNode(timeFilter, "property_with_response_v1"),
      right: filter,
      operator: "and",
    },
    org_id
  );
}
