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

// --OLD CACHE-- old cache count calc
export async function getCacheCountDeprecated(
  orgId: string,
  filter: FilterNode
): Promise<Result<number, string>> {
  const builtFilter = await buildFilterWithAuthClickHouseCacheHits({
    org_id: orgId,
    filter,
    argsAcc: [],
  });

  const query = `select count(*) as count from cache_hits where ${builtFilter.filter}`;

  const res = await dbQueryClickhouse<{
    count: number;
  }>(query, builtFilter.argsAcc);

  return resultMap(res, (x) => +x[0].count);
}

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

  const rmtResult = await dbQueryClickhouse<{
    count: number;
  }>(query, builtFilter.argsAcc);

  const deprecatedResult = await getCacheCountDeprecated(orgId, filter);

  return resultMap(rmtResult, (rmt) => {
    const rmtCount = +rmt[0].count;
    const deprecatedCount = deprecatedResult.error || deprecatedResult.data === null ? 0 : +deprecatedResult.data;
    return rmtCount + deprecatedCount;
  });
}

// --OLD CACHE-- old model metrics calc
export async function getModelMetricsDeprecated(
  orgId: string,
  filter: FilterNode
): Promise<Result<ModelMetrics[], string>> {
  const builtFilter = await buildFilterWithAuthClickHouseCacheHits({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `
  select 
    model, 
    provider,
    sum(completion_tokens) as sum_completion_tokens, 
    sum(prompt_tokens) as sum_prompt_tokens, 
    sum(completion_tokens + prompt_tokens) as sum_tokens,
    0 as prompt_cache_write_tokens,
    0 as prompt_cache_read_tokens,
    0 as prompt_audio_tokens,
    0 as completion_audio_tokens
  from cache_hits 
  where (${builtFilter.filter})
  group by model, provider`;

  return dbQueryClickhouse<ModelMetrics>(query, builtFilter.argsAcc);
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

  const rmtResult = await dbQueryClickhouse<ModelMetrics>(query, builtFilter.argsAcc);
  const deprecatedResult = await getModelMetricsDeprecated(orgId, filter);

  return resultMap(rmtResult, (rmt) => {
    const deprecatedMetrics = deprecatedResult.data ?? [];
    
    const metricsMap = new Map<string, ModelMetrics>();
    
    rmt.forEach((metric) => {
      const key = `${metric.model}-${metric.provider}`;
      metricsMap.set(key, metric);
    });

    deprecatedMetrics.forEach((metric) => {
      const key = `${metric.model}-${metric.provider}`;
      const existing = metricsMap.get(key);
      if (existing) {
        metricsMap.set(key, {
          model: metric.model,
          provider: metric.provider,
          sum_completion_tokens: (existing.sum_completion_tokens || 0) + (metric.sum_completion_tokens || 0),
          sum_prompt_tokens: (existing.sum_prompt_tokens || 0) + (metric.sum_prompt_tokens || 0),
          sum_tokens: (existing.sum_tokens || 0) + (metric.sum_tokens || 0),
          prompt_cache_write_tokens: (existing.prompt_cache_write_tokens || 0) + (metric.prompt_cache_write_tokens || 0),
          prompt_cache_read_tokens: (existing.prompt_cache_read_tokens || 0) + (metric.prompt_cache_read_tokens || 0),
          prompt_audio_tokens: (existing.prompt_audio_tokens || 0) + (metric.prompt_audio_tokens || 0),
          completion_audio_tokens: (existing.completion_audio_tokens || 0) + (metric.completion_audio_tokens || 0),
        });
      } else {
        metricsMap.set(key, metric);
      }
    });
    return Array.from(metricsMap.values());
  });
}

// --OLD CACHE-- old time saved calc
export async function getTimeSavedDeprecated(
  orgId: string,
  filter: FilterNode
) {
  const builtFilter = await buildFilterWithAuthClickHouseCacheHits({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `
  select sum(latency) as total_latency_ms
  from cache_hits
  where (${builtFilter.filter})
  `;
  return dbQueryClickhouse<{ total_latency_ms: number }>(query, builtFilter.argsAcc);
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
      request_id,
      cache_reference_id,
      latency
    FROM request_response_rmt
    WHERE (${builtFilter.filter})
      AND cache_reference_id != '${DEFAULT_UUID}'
  )
  SELECT 
    sum(original.latency) as total_latency_ms
  FROM cache_hits ch
  LEFT JOIN request_response_rmt original 
    ON ch.cache_reference_id = original.request_id
  WHERE original.cache_reference_id = '${DEFAULT_UUID}'
  `;

  const rmtResult = await dbQueryClickhouse<{
    total_latency_ms: number;
  }>(query, builtFilter.argsAcc);

  const deprecatedResult = await getTimeSavedDeprecated(orgId, filter);

  return resultMap(rmtResult, (rmt) => {
    const rmtLatency = +(rmt[0]?.total_latency_ms ?? 0);
    const deprecatedLatency = +(deprecatedResult.data?.[0]?.total_latency_ms ?? 0);
    return rmtLatency / 1000 + deprecatedLatency / 1000;
  });
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

// --OLD CACHE-- old top requests calc
export async function getTopRequestsDeprecated(
  orgId: string,
  filter: FilterNode
) {
  const builtFilter = await buildFilterWithAuthClickHouseCacheHits({
    org_id: orgId,
    filter,
    argsAcc: [],
  });

  const query = `
  WITH cache_hits_grouped AS (
    SELECT 
      request_id, 
      count(*) as count, 
      max(created_at) as last_used, 
      min(created_at) as first_used
    FROM cache_hits
    WHERE (${builtFilter.filter}) 
    GROUP BY request_id
  )
  SELECT 
    ch.request_id,
    ch.count,
    ch.last_used,
    ch.first_used,
    rr.model,
    rr.request_body as prompt,
    rr.response_body as response
  FROM cache_hits_grouped ch
  LEFT JOIN request_response_rmt rr ON ch.request_id = rr.request_id
  WHERE rr.cache_reference_id = '${DEFAULT_UUID}'
  ORDER BY ch.count DESC
  LIMIT 10`;

  return dbQueryClickhouse<{
    request_id: string;
    count: number;
    last_used: Date;
    first_used: Date;
    prompt: string;
    response: string;
    model: string;
  }>(query, builtFilter.argsAcc);
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
    GROUP BY cache_reference_id
  )
  SELECT 
    orig.request_id,
    ch.count,
    ch.first_hit as first_used,
    ch.last_hit as last_used,
    orig.model,
    orig.request_body as prompt,
    orig.response_body as response
  FROM cache_hits ch
  JOIN request_response_rmt orig 
    ON ch.cache_reference_id = orig.request_id
  WHERE orig.cache_reference_id = '${DEFAULT_UUID}'
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

  const deprecatedResult = await getTopRequestsDeprecated(orgId, filter);

  return resultMap(rmtResult, (rmt) => {
    const deprecatedRequests = deprecatedResult.error || !deprecatedResult.data ? [] : deprecatedResult.data;
    
    const requestMap = new Map<string, {
      request_id: string;
      count: number;
      first_used: Date;
      last_used: Date;
      model: string;
      prompt: string;
      response: string;
    }>();

    rmt.forEach((request) => {
      requestMap.set(request.request_id, {
        ...request,
        count: +request.count,
        first_used: new Date(request.first_used),
        last_used: new Date(request.last_used),
      });
    });

    deprecatedRequests.forEach((request) => {
      const existing = requestMap.get(request.request_id);
      if (existing) {
        requestMap.set(request.request_id, {
          ...request,
          count: +existing.count + +request.count,
          first_used: new Date(Math.min(existing.first_used.getTime(), new Date(request.first_used).getTime())),
          last_used: new Date(Math.max(existing.last_used.getTime(), new Date(request.last_used).getTime())),
        });
      } else {
        requestMap.set(request.request_id, {
          ...request,
          count: +request.count,
          first_used: new Date(request.first_used),
          last_used: new Date(request.last_used),
        });
      }
    });

    const mergedRequests = Array.from(requestMap.values());
    mergedRequests.sort((a, b) => b.count - a.count);
    
    return mergedRequests.slice(0, 10);
  });
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
