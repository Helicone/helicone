import { FilterNode } from "@helicone-package/filters/filterDefs";
import { timeFilterToFilterNode } from "@helicone-package/filters/helpers";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { Result, resultMap } from "@/packages/common/result";
import { dbQueryClickhouse } from "../db/dbExecute";
import { transformSearchPropertiesToPropertyKey } from "./propertyFilterHelpers";

export async function getAverageLatency(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string
): Promise<Result<number, string>> {
  // Transform search_properties to property_key to avoid ARRAY JOIN
  const transformedFilter = transformSearchPropertiesToPropertyKey({
    left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
    right: filter,
    operator: "and",
  });

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
  WITH total_count AS (
    SELECT
      count(*) as count,
      sum(request_response_rmt.latency) as total_latency
    FROM request_response_rmt
    WHERE (
      (${filterString})
    )
  )
  SELECT CASE
    WHEN count = 0 THEN 0
    ELSE total_latency / count
  END as average_latency
  FROM total_count
`;

  const res = await dbQueryClickhouse<{
    average_latency: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => +d[0].average_latency);
}
