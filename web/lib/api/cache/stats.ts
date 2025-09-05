import { FilterNode } from "@helicone-package/filters/filterDefs";
import { buildFilterWithAuthClickHouseCacheMetrics } from "@helicone-package/filters/filters";
import { Result, resultMap } from "@/packages/common/result";
import { TimeFilter } from "@helicone-package/filters/filterDefs";
import { dbQueryClickhouse } from "../db/dbExecute";
import { ModelMetrics } from "../metrics/modelMetrics";

function buildTimeFilter(timeFilter: TimeFilter): FilterNode {
  return {
    left: {
      cache_metrics: {
        date: {
          gte: timeFilter.start,
        },
      },
    },
    operator: "and",
    right: {
      cache_metrics: {
        date: {
          lte: timeFilter.end,
        },
      },
    },
  };
}

export async function getCacheCountClickhouse(
  orgId: string,
  timeFilter: TimeFilter,
): Promise<Result<number, string>> {
  const builtFilter = await buildFilterWithAuthClickHouseCacheMetrics({
    org_id: orgId,
    filter: {},
    argsAcc: [],
  });

  const query = `
  select sum(cache_hit_count) as count 
  from cache_metrics 
  where ${builtFilter.filter}
  ${
    timeFilter
      ? `and date >= '${timeFilter.start.toISOString().split("T")[0]}'
  and date <= '${timeFilter.end.toISOString().split("T")[0]}'`
      : ""
  }`;

  const queryResult = await dbQueryClickhouse<{ count: number }>(
    query,
    builtFilter.argsAcc,
  );
  return resultMap(queryResult, (results) => Number(results[0].count));
}

export async function getTotalSavingsClickhouse(
  orgId: string,
  timeFilter: TimeFilter,
): Promise<Result<ModelMetrics[], string>> {
  const builtFilter = await buildFilterWithAuthClickHouseCacheMetrics({
    org_id: orgId,
    filter: buildTimeFilter(timeFilter),
    argsAcc: [],
  });

  const query = `
  SELECT
    provider,    
    model,
    sum(saved_completion_tokens) as sum_completion_tokens,
    sum(saved_prompt_tokens) as sum_prompt_tokens,
    sum(saved_completion_tokens + saved_prompt_tokens) as sum_tokens,
    sum(saved_prompt_cache_write_tokens) as prompt_cache_write_tokens,
    sum(saved_prompt_cache_read_tokens) as prompt_cache_read_tokens,
    sum(saved_prompt_audio_tokens) as prompt_audio_tokens,
    sum(saved_completion_audio_tokens) as completion_audio_tokens
  FROM cache_metrics
  WHERE (${builtFilter.filter})
  GROUP BY model, provider`;

  const rmtResult = await dbQueryClickhouse<ModelMetrics>(
    query,
    builtFilter.argsAcc,
  );

  return resultMap(rmtResult, (metrics) =>
    Object.values(
      metrics.reduce(
        (acc, metric) => ({
          ...acc,
          [`${metric.model}-${metric.provider}`]: metric,
        }),
        {} as Record<string, ModelMetrics>,
      ),
    ),
  );
}

export async function getTimeSavedClickhouse(
  orgId: string,
  timeFilter: TimeFilter,
): Promise<Result<number, string>> {
  const builtFilter = await buildFilterWithAuthClickHouseCacheMetrics({
    org_id: orgId,
    filter: buildTimeFilter(timeFilter),
    argsAcc: [],
  });
  const query = `
  SELECT sum(saved_latency_ms) as total_latency_ms
  FROM cache_metrics
  WHERE (${builtFilter.filter})
  `;
  const queryResult = await dbQueryClickhouse<{ total_latency_ms: number }>(
    query,
    builtFilter.argsAcc,
  );
  return resultMap(queryResult, (results) =>
    Number(results[0]?.total_latency_ms ?? 0),
  );
}

export interface TopCachedRequest {
  request_id: string;
  count: number;
  first_used: Date;
  last_used: Date;
  model: string;
  prompt: string;
  response: string;
}

export async function getTopCachedRequestsClickhouse(
  orgId: string,
  timeFilter: TimeFilter,
): Promise<Result<TopCachedRequest[], string>> {
  const builtFilter = await buildFilterWithAuthClickHouseCacheMetrics({
    org_id: orgId,
    filter: buildTimeFilter(timeFilter),
    argsAcc: [],
  });

  const query = `
  SELECT
    request_id,
    sum(cache_hit_count) as count,
    min(first_hit) as first_used,
    max(last_hit) as last_used,
    any(model) as model,
    any(request_body) as prompt,
    any(response_body) as response
  FROM cache_metrics
  WHERE ${builtFilter.filter}
  GROUP BY request_id
  ORDER BY count DESC
  LIMIT 10
  `;

  const rmtResult = await dbQueryClickhouse<TopCachedRequest>(
    query,
    builtFilter.argsAcc,
  );

  return resultMap(rmtResult, (requests) =>
    requests
      .map((request) => ({
        ...request,
        count: Number(request.count),
        first_used: new Date(request.first_used),
        last_used: new Date(request.last_used),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  );
}
