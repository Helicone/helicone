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
  limit: number,
  sortKey?: string,
  sortDirection?: "asc" | "desc"
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

  // Default sort is by total_requests DESC
  let orderByClause = "ORDER BY total_requests DESC";

  // Map frontend sort keys to database column names
  const sortKeyMap: Record<string, string> = {
    property_value: "property_value",
    total_requests: "total_requests",
    total_cost: "total_cost",
    avg_prompt_tokens_per_request: "avg_prompt_tokens_per_request",
    avg_completion_tokens_per_request: "avg_completion_tokens_per_request",
    avg_latency_per_request: "avg_latency_per_request",
    average_cost_per_request: "total_cost / total_requests",
  };

  // If sortKey is provided and valid, use it for ordering
  if (sortKey && sortKeyMap[sortKey]) {
    const direction = sortDirection === "asc" ? "ASC" : "DESC";
    orderByClause = `ORDER BY ${sortKeyMap[sortKey]} ${direction}`;
  }

  const query = `
  SELECT 
    value AS property_value,
    count(*) AS total_requests,
    min(request_response_rmt.request_created_at) AS active_since,
    sum(request_response_rmt.completion_tokens) / count(*) AS avg_completion_tokens_per_request,
    sum(request_response_rmt.prompt_tokens) / count(*) AS avg_prompt_tokens_per_request,
    sum(request_response_rmt.latency) / count(*) AS avg_latency_per_request,
    ${clickhousePriceCalc("request_response_rmt")} AS total_cost
  FROM request_response_rmt
  ARRAY JOIN mapValues(properties) AS value, mapKeys(properties) AS key
  WHERE (
    ${filterString}
  )
  GROUP BY value
  ${orderByClause}
  LIMIT ${limit}
`;

  const res = await dbQueryClickhouse<{
    property_value: string;
    total_requests: number;
    active_since: string;
    avg_completion_tokens_per_request: number;
    avg_prompt_tokens_per_request: number;
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
        avg_prompt_tokens_per_request: +r.avg_prompt_tokens_per_request,
        avg_latency_per_request: +r.avg_latency_per_request,
        total_cost: +r.total_cost,
      };
    });
    // Remove the frontend sorting since we're now sorting in the database
  });
}
