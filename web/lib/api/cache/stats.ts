import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuth } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import {
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "../../sql/timeHelpers";
import { dbExecute } from "../db/dbExecute";
import { ModelMetrics } from "../metrics/modelMetrics";
import { DataOverTimeRequest } from "../metrics/timeDataHandlerWrapper";

/**
 * Retrieves the count of cache hits based on the provided organization ID and filter.
 * @param orgId The ID of the organization.
 * @param filter The filter to apply to the cache hits.
 * @returns A promise that resolves to the count of cache hits, or an error message if the retrieval fails.
 */
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

/**
 * Retrieves model metrics from the cache based on the provided organization ID and filter.
 * @param org_id The ID of the organization.
 * @param filter The filter to apply to the query.
 * @returns A promise that resolves to an array of ModelMetrics.
 */
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

/**
 * Retrieves the total time saved in milliseconds for a given organization and filter.
 * @param org_id - The ID of the organization.
 * @param filter - The filter to apply to the query.
 * @returns The total time saved in seconds.
 */
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

/**
 * Retrieves the top model usage based on the provided organization ID and filter.
 * @param org_id The ID of the organization.
 * @param filter The filter to apply.
 * @returns A promise that resolves to an array of objects containing the model name and its count.
 */
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

/**
 * Retrieves the top user usage based on the provided organization ID and filter.
 * @param org_id The ID of the organization.
 * @param filter The filter to apply.
 * @returns A promise that resolves to an array of objects containing the user ID and count.
 */
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

/**
 * Retrieves the top requests based on the provided organization ID and filter.
 * @param org_id The ID of the organization.
 * @param filter The filter to apply to the requests.
 * @returns A promise that resolves to an array of objects containing the request ID, count, last used date, first used date, prompt, and model.
 */
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

/**
 * Retrieves model usage over time based on the provided parameters.
 * @param userFilter The filter to apply to the data.
 * @param orgId The ID of the organization.
 * @param dbIncrement The time increment for grouping the data.
 * @param timeZoneDifference The time zone difference in minutes.
 * @returns An object containing the model, created_at_trunc, and sum_tokens.
 */
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
