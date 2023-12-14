import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { CLICKHOUSE_PRICE_CALC } from "../../sql/constants";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface TotalCost {
  cost: number;
}

/**
 * Calculates the total cost based on the provided filter, time filter, and organization ID.
 * @param filter The filter node to apply.
 * @param timeFilter The time range to filter the data.
 * @param org_id The ID of the organization.
 * @returns A promise that resolves to the total cost as a number, or an error message as a string.
 */
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
