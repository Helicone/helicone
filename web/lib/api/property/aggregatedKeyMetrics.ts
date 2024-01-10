import {
  FilterNode,
  timeFilterToFilterNode,
} from "../../shared/filters/filterDefs";
import { buildFilterWithAuthClickHousePropResponse } from "../../shared/filters/filters";
import { resultMap } from "../../shared/result";
import { CLICKHOUSE_PRICE_CALC } from "../../sql/constants";
import {
  dbQueryClickhouse,
  printRunnableQuery,
} from "../../shared/db/dbExecute";

export async function getAggregatedKeyMetrics(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string
) {
  const { filter: filterString, argsAcc } =
    await buildFilterWithAuthClickHousePropResponse({
      org_id,
      filter: {
        left: timeFilterToFilterNode(timeFilter, "property_with_response_v1"),
        right: filter,
        operator: "and",
      },
      argsAcc: [],
    });
  const query = `
  select 
  property_with_response_v1.property_value,
  count(*) as total_requests,
  min(property_with_response_v1.request_created_at) as active_since,
  sum(property_with_response_v1.completion_tokens) / count(*) as avg_completion_tokens_per_request,
  sum(property_with_response_v1.latency) / count(*) as avg_latency_per_request,
  ${CLICKHOUSE_PRICE_CALC("property_with_response_v1")} as total_cost
from property_with_response_v1
where (
${filterString}
)
group by property_value
ORDER BY count(*) DESC
LIMIT 10
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
    return d.map((r) => {
      return {
        property_value: r.property_value,
        total_requests: +r.total_requests,
        active_since: r.active_since,
        avg_completion_tokens_per_request: +r.avg_completion_tokens_per_request,
        avg_latency_per_request: +r.avg_latency_per_request,
        total_cost: +r.total_cost,
      };
    });
  });
}
