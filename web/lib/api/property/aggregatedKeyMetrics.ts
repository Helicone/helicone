import { clickhousePriceCalc } from "../../../packages/cost";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { timeFilterToFilterNode } from "@/services/lib/filters/helpers/filterFunctions";
import { buildFilterWithAuthClickHousePropertiesV2 } from "../../../services/lib/filters/filters";
import { resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export async function getAggregatedKeyMetrics(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string,
  limit: number
) {
  const { filter: filterString, argsAcc } =
    await buildFilterWithAuthClickHousePropertiesV2({
      org_id,
      filter: {
        left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    });
  const query = `
  SELECT 
    value AS property_value,
    count(*) AS total_requests,
    min(request_response_rmt.request_created_at) AS active_since,
    sum(request_response_rmt.completion_tokens) / count(*) AS avg_completion_tokens_per_request,
    sum(request_response_rmt.latency) / count(*) AS avg_latency_per_request,
    ${clickhousePriceCalc("request_response_rmt")} AS total_cost
  FROM request_response_rmt
  ARRAY JOIN mapValues(properties) AS value, mapKeys(properties) AS key
  WHERE (
    ${filterString}
  )
  GROUP BY value
  ORDER BY total_requests DESC
  LIMIT ${limit}
`;

  const res = await dbQueryClickhouse<{
    property_value: string;
    total_requests: number;
    active_since: string;
    avg_completion_tokens_per_request: number;
    avg_latency_per_request: number;
    total_cost: number;
  }>(query, argsAcc);

  return resultMap(res, (d) => {
    return (
      d
        .map((r) => {
          return {
            property_value: r.property_value,
            total_requests: +r.total_requests,
            active_since: r.active_since,
            avg_completion_tokens_per_request:
              +r.avg_completion_tokens_per_request,
            avg_latency_per_request: +r.avg_latency_per_request,
            total_cost: +r.total_cost,
          };
        })
        // sort by total requests and then by cost if its tied
        .sort((a, b) => {
          if (a.total_requests === b.total_requests) {
            return a.total_cost - b.total_cost;
          }
          return b.total_requests - a.total_requests;
        })
    );
  });
}
