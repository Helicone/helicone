import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
  buildFilterWithAuthClickHouseCacheHits,
} from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../../packages/common/result";
import {
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";
import { ModelMetrics } from "../metrics/modelMetrics";
import { DataOverTimeRequest } from "../metrics/timeDataHandlerWrapper";
import { DEFAULT_UUID } from "@/packages/llm-mapper/types";

export async function getCacheCountClickhouse(
  orgId: string,
  filter: FilterNode
): Promise<Result<number, string>> {
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id: orgId,
    filter,
    argsAcc: [],
  });

  const query = `
  select count(*) as count 
  from request_response_rmt 
  where ${builtFilter.filter}
    AND cache_reference_id != '${DEFAULT_UUID}'`;

  const queryResult = await dbQueryClickhouse<{ count: number }>(
    query,
    builtFilter.argsAcc
  );
  return resultMap(queryResult, (results) => Number(results[0].count));
}

export async function getModelMetricsClickhouse(
  orgId: string,
  filter: FilterNode
): Promise<Result<ModelMetrics[], string>> {
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `
  select model, 
    provider,
    sum(completion_tokens) as sum_completion_tokens, 
    sum(prompt_tokens) as sum_prompt_tokens, 
    sum(completion_tokens + prompt_tokens) as sum_tokens,
    sum(prompt_cache_write_tokens) as prompt_cache_write_tokens,
    sum(prompt_cache_read_tokens) as prompt_cache_read_tokens,
    sum(prompt_audio_tokens) as prompt_audio_tokens,
    sum(completion_audio_tokens) as completion_audio_tokens
  from request_response_rmt 
  where (${builtFilter.filter})
    AND cache_reference_id != '${DEFAULT_UUID}'
  group by model, provider`;

  const rmtResult = await dbQueryClickhouse<ModelMetrics>(
    query,
    builtFilter.argsAcc
  );

  return resultMap(rmtResult, (metrics) =>
    Object.values(
      metrics.reduce(
        (acc, metric) => ({
          ...acc,
          [`${metric.model}-${metric.provider}`]: metric,
        }),
        {} as Record<string, ModelMetrics>
      )
    )
  );
}

export async function getTimeSavedClickhouse(
  orgId: string,
  filter: FilterNode
) {
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `
  WITH cache_hits AS (
    SELECT 
      count (*) as count,
      cache_reference_id,
    FROM request_response_rmt
    WHERE (${builtFilter.filter})
      AND cache_reference_id != '${DEFAULT_UUID}'
      AND request_created_at > now() - interval '30 days'
      AND cache_enabled = true
    GROUP BY cache_reference_id
  )
  SELECT 
    sum(request_response_rmt.latency) as total_latency_ms
  FROM cache_hits ch
  LEFT JOIN request_response_rmt
    ON ch.cache_reference_id = request_response_rmt.request_id
  WHERE request_response_rmt.cache_reference_id = '${DEFAULT_UUID}'
  AND request_created_at > now() - interval '90 days'
  AND ${builtFilter.filter}
  `;

  const queryResult = await dbQueryClickhouse<{ total_latency_ms: number }>(
    query,
    builtFilter.argsAcc
  );
  return resultMap(
    queryResult,
    (results) => Number(results[0]?.total_latency_ms ?? 0) / 1000
  );
}

export async function getTopModelUsageClickhouse(
  orgId: string,
  filter: FilterNode
) {
  const builtFilter = await buildFilterWithAuthClickHouseCacheHits({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `select model, count(*) as count from cache_hits where (${builtFilter.filter}) group by model order by count desc limit 10`;

  const res = await dbQueryClickhouse<{
    model: string;
    count: number;
  }>(query, builtFilter.argsAcc);

  return res;
}

export async function getTopUserUsage(org_id: string, filter: FilterNode) {
  const builtFilter = await buildFilterWithAuth({
    org_id,
    argsAcc: [],
    filter,
  });
  const query = `
SELECT 
  request.user_id as user_id,
  count(*) as count
FROM cache_hits
  left join request on cache_hits.request_id = request.id
WHERE (
  (${builtFilter.filter})
)
GROUP BY request.user_id
ORDER BY count DESC
LIMIT 5;
    `;
  return dbExecute<{ user_id: string; count: number }>(
    query,
    builtFilter.argsAcc
  );
}

export async function getTopRequestsClickhouse(
  orgId: string,
  filter: FilterNode
) {
  const builtFilter = await buildFilterWithAuthClickHouse({
    org_id: orgId,
    filter,
    argsAcc: [],
  });

  const query = `
  WITH cache_hits AS (
    SELECT 
      cache_reference_id,
      count(*) as count,
      min(request_created_at) as first_hit,
      max(request_created_at) as last_hit
    FROM request_response_rmt
    WHERE ${builtFilter.filter}
      AND cache_reference_id != '${DEFAULT_UUID}'
      AND request_created_at > now() - interval '30 days'
    GROUP BY cache_reference_id
    LIMIT 10
  )
  SELECT 
    request_response_rmt.request_id,
    ch.count,
    ch.first_hit as first_used,
    ch.last_hit as last_used,
    request_response_rmt.model,
    request_response_rmt.request_body as prompt,
    request_response_rmt.response_body as response
  FROM cache_hits ch
  JOIN request_response_rmt 
    ON ch.cache_reference_id = request_response_rmt.request_id
  WHERE request_response_rmt.cache_reference_id = '${DEFAULT_UUID}'
  AND ${builtFilter.filter}
  ORDER BY count DESC
  LIMIT 10`;

  const rmtResult = await dbQueryClickhouse<{
    request_id: string;
    count: number;
    first_used: Date;
    last_used: Date;
    model: string;
    prompt: string;
    response: string;
  }>(query, builtFilter.argsAcc);

  return resultMap(rmtResult, (requests) =>
    requests
      .map((request) => ({
        ...request,
        count: Number(request.count),
        first_used: new Date(request.first_used),
        last_used: new Date(request.last_used),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  );
}

export async function getModelUsageOverTime({
  userFilter,
  orgId,
  dbIncrement,
  timeZoneDifference,
}: DataOverTimeRequest) {
  const filter: FilterNode = userFilter;
  if (!isValidTimeIncrement(dbIncrement)) {
    return { data: null, error: "Invalid time increment" };
  }
  if (!isValidTimeZoneDifference(timeZoneDifference)) {
    return { data: null, error: "Invalid time zone difference" };
  }
  const builtFilter = await buildFilterWithAuth({
    filter,
    argsAcc: [],
    org_id: orgId,
  });
  const dateTrunc = `DATE_TRUNC('${dbIncrement}', request.created_at + INTERVAL '${timeZoneDifference} minutes')`;
  const query = `
SELECT
  response.body ->> 'model'::text as model,
  ${dateTrunc} as created_at_trunc,
  count(*) AS sum_tokens
FROM cache_hits
  left join request on cache_hits.request_id = request.id
  left join response on request.id = response.request
WHERE (
  response.body ->> 'model'::text is not null
  AND (${builtFilter.filter})
)
GROUP BY response.body ->> 'model'::text, ${dateTrunc}
`;
  return await dbExecute<{
    model: string;
    created_at_trunc: Date;
    sum_tokens: number;
  }>(query, builtFilter.argsAcc);
}
