import { FilterNode } from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuth,
  buildFilterWithAuthClickHouseCacheHits,
} from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import {
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { dbExecute, dbQueryClickhouse } from "../db/dbExecute";
import { ModelMetrics } from "../metrics/modelMetrics";
import { DataOverTimeRequest } from "../metrics/timeDataHandlerWrapper";

export async function getCacheCount(
  orgId: string,
  filter: FilterNode
): Promise<Result<number, string>> {
  const builtFilter = await buildFilterWithAuth({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `
  select count(*) as count from cache_hits
  left join request ON cache_hits.request_id = request.id
  WHERE (
    (${builtFilter.filter})
  )
`;
  return resultMap(
    await dbExecute<{
      count: number;
    }>(query, builtFilter.argsAcc),
    (x) => x[0].count
  );
}

export async function getCacheCountClickhouse(
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

export async function getModelMetricsClickhouse(
  orgId: string,
  filter: FilterNode
): Promise<Result<ModelMetrics[], string>> {
  const builtFilter = await buildFilterWithAuthClickHouseCacheHits({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `
  select model, 
    sum(completion_tokens) as sum_completion_tokens, 
    sum(prompt_tokens) as sum_prompt_tokens, 
    sum(completion_tokens + prompt_tokens) as sum_tokens 
  from cache_hits 
  where (${builtFilter.filter})
  group by model`;

  const res = await dbQueryClickhouse<ModelMetrics>(query, builtFilter.argsAcc);

  return res;
}

export async function getModelMetrics(org_id: string, filter: FilterNode) {
  const builtFilter = await buildFilterWithAuth({
    org_id,
    argsAcc: [],
    filter,
  });
  const query = `
SELECT response.body ->> 'model'::text as model,
  sum(response.completion_tokens + response.prompt_tokens) AS sum_tokens,
  sum(response.prompt_tokens) AS sum_prompt_tokens,
  sum(response.completion_tokens) AS sum_completion_tokens
FROM cache_hits
  left join request on cache_hits.request_id = request.id
  left join response on request.id = response.request
WHERE (
  (${builtFilter.filter})
)
GROUP BY response.body ->> 'model'::text;
    `;
  return dbExecute<ModelMetrics>(query, builtFilter.argsAcc);
}

export async function getTimeSavedClickhouse(
  orgId: string,
  filter: FilterNode
) {
  const builtFilter = await buildFilterWithAuthClickHouseCacheHits({
    org_id: orgId,
    filter,
    argsAcc: [],
  });
  const query = `SELECT sum(latency) AS total_latency_ms
  FROM cache_hits
  WHERE (${builtFilter.filter});`;

  const temp = await dbQueryClickhouse<{
    total_latency_ms: number;
  }>(query, builtFilter.argsAcc);

  const res = resultMap(temp, (x) => +x[0].total_latency_ms / 1000);
  return res;
}

export async function getTimeSaved(org_id: string, filter: FilterNode) {
  const builtFilter = await buildFilterWithAuth({
    org_id,
    argsAcc: [],
    filter,
  });
  const query = `
SELECT sum(response.delay_ms) AS total_latency_ms
FROM cache_hits
  left join request on cache_hits.request_id = request.id
  left join response on request.id = response.request
WHERE (
  (${builtFilter.filter})
)
    `;
  const res = resultMap(
    await dbExecute<{
      total_latency_ms: number;
    }>(query, builtFilter.argsAcc),
    (x) => +x[0].total_latency_ms / 1000
  );
  return res;
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

export async function getTopModelUsage(org_id: string, filter: FilterNode) {
  const builtFilter = await buildFilterWithAuth({
    org_id,
    argsAcc: [],
    filter,
  });
  const query = `
SELECT 
  response.body ->> 'model'::text as model,
  count(*) as count
FROM cache_hits
  left join request on cache_hits.request_id = request.id
  left join response on request.id = response.request
WHERE (
  (${builtFilter.filter})
)
GROUP BY response.body ->> 'model'::text
ORDER BY count DESC
LIMIT 10;
    `;
  return resultMap(
    await dbExecute<{ model: string | null; count: number }>(
      query,
      builtFilter.argsAcc
    ),
    (x) =>
      x.map((y) => ({
        model: y.model ?? "Unknown",
        count: +y.count,
      }))
  );
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
  const builtFilter = await buildFilterWithAuthClickHouseCacheHits({
    org_id: orgId,
    filter,
    argsAcc: [],
  });

  const query = `
  select 
    request_id, 
    count(*) as count, 
    max(created_at) as last_used, 
    min(created_at) as first_used,
    model
  from cache_hits
  where (${builtFilter.filter}) 
  group by request_id, model, prompt
  order by count desc
  limit 10`;

  const res = await dbQueryClickhouse<{
    request_id: string;
    count: number;
    last_used: Date;
    first_used: Date;
    model: string;
  }>(query, builtFilter.argsAcc);

  if (res.error) {
    return res;
  }

  const promptQuery = `
  SELECT 
    id as request_id, 
    (coalesce(request.body ->>'prompt', request.body ->'messages'->-1->>'content'))::text as prompt 
  FROM 
    request 
  WHERE 
    id IN (${res?.data?.map((x) => `'${x.request_id}'`).join(",")})`;

  const prompts = await dbExecute<{
    request_id: string;
    prompt: string;
  }>(promptQuery, []);

  if (prompts.error) {
    return prompts;
  }

  const combinedData = res?.data?.map((item) => ({
    ...item,
    prompt: prompts?.data?.find((p) => p.request_id === item.request_id)
      ?.prompt,
  }));

  return { ...res, data: combinedData };
}

export async function getTopRequests(org_id: string, filter: FilterNode) {
  const builtFilter = await buildFilterWithAuth({
    org_id,
    argsAcc: [],
    filter,
  });
  const query = `
SELECT
  request.id as request_id,
  count(*) as count,
  MAX(request.created_at) as last_used,
  MIN(request.created_at) as first_used,
  (select (coalesce(request.body ->>'prompt', request.body ->'messages'->-1->>'content'))::text as prompt
    from request r
    where r.id = request.id
    limit 1
  ) as prompt,
  (
    select (coalesce(request.body ->>'model'))::text as model
  ) as model
FROM cache_hits
  left join request on cache_hits.request_id = request.id
WHERE (
  (${builtFilter.filter})
)
GROUP BY request.id
ORDER BY count DESC
LIMIT 10;
    `;
  return dbExecute<{
    request_id: string;
    count: number;
    last_used: Date;
    first_used: Date;
    prompt: string;
    model: string;
  }>(query, builtFilter.argsAcc);
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
