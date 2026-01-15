import { FilterNode } from "@helicone-package/filters/filterDefs";
import { timeFilterToFilterNode } from "@helicone-package/filters/helpers";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { Result, resultMap } from "@/packages/common/result";
import { dbQueryClickhouse } from "../db/dbExecute";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { transformSearchPropertiesToPropertyKey } from "./propertyFilterHelpers";

export interface TotalCost {
  cost: number;
  count?: number;
}

export async function getTotalCostRaw(
  filter: FilterNode,
  org_id: string
): Promise<Result<number, string>> {
  // Transform search_properties to property_key to avoid ARRAY JOIN
  const transformedFilter = transformSearchPropertiesToPropertyKey(filter);

  const { filter: filterString, argsAcc } = await buildFilterWithAuthClickHouse(
    {
      org_id,
      filter: transformedFilter,
      argsAcc: [],
    }
  );

  // Query without ARRAY JOIN - uses property_key filter which generates
  // has(mapKeys(properties), 'key') instead of requiring ARRAY JOIN
  const query = `
  WITH total_cost AS (
    SELECT sum(cost) / ${COST_PRECISION_MULTIPLIER} as cost
    FROM request_response_rmt
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
  org_id: string,
): Promise<Result<number, string>> {
  return getTotalCostRaw(
    {
      left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
      right: filter,
      operator: "and",
    },
    org_id,
  );
}
