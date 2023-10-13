import { Env, hash } from "../..";
import { Database } from "../../../supabase/database.types";
import { ClickhouseClientWrapper } from "../db/clickhouse";

export const CLICKHOUSE_PRICE_CALC = (table: string) => `
sum(
  CASE
    -- Finetuned
    WHEN (${table}.model LIKE '%ada:%') THEN 0.0016 * ${table}.prompt_tokens + 0.0016 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%babbage:%') THEN 0.0024 * ${table}.prompt_tokens + 0.0024 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%curie:%') THEN 0.012 * ${table}.prompt_tokens + 0.012 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%davinci:%') THEN 0.12 * ${table}.prompt_tokens + 0.12 * ${table}.completion_tokens
    -- Non-finetuned
    WHEN (${table}.model LIKE '%gpt-4-32k-0314%') THEN 0.06 * ${table}.prompt_tokens + 0.12 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-4-32k-0613%') THEN 0.06 * ${table}.prompt_tokens + 0.12 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-3.5-turbo-0613%') THEN 0.0015 * ${table}.prompt_tokens + 0.002 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-3.5-turbo-16k-0613%') THEN 0.003 * ${table}.prompt_tokens + 0.004 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%text-embedding-ada-002-v2%') THEN 0.0001 * ${table}.prompt_tokens + 0.0001 * coalesce(${table}.completion_tokens, 0)
    WHEN (${table}.model LIKE '%ada%') THEN 0.0004 * ${table}.prompt_tokens + 0.0004 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%babbage%') THEN 0.0005 * ${table}.prompt_tokens + 0.0005 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%curie%') THEN 0.002 * ${table}.prompt_tokens + 0.002 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%davinci%') THEN 0.02 * ${table}.prompt_tokens + 0.02 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-3.5-turbo%') THEN 0.002 * ${table}.prompt_tokens + 0.002 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-4%') THEN 0.03 * ${table}.prompt_tokens + 0.06 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-v1%') THEN 0.0163 * ${table}.prompt_tokens + 0.0551 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-instant-v1%') THEN 0.01102 * ${table}.prompt_tokens + 0.03268 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-2%') THEN 0.01102 * ${table}.prompt_tokens + 0.03268 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-instant-1%') THEN 0.00163 * ${table}.prompt_tokens + 0.00551 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-2.0%') THEN 0.01102 * ${table}.prompt_tokens + 0.03268 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-instant-1.2%') THEN 0.00163 * ${table}.prompt_tokens + 0.00551 * ${table}.completion_tokens
    ELSE 0
  END
  ) / 1000
`;

const generateSubquery = (index: number) => {
  const secondsVal = `val_${index * 2}`;
  const proxyKeyIdVal = `val_${index * 2 + 1}`;

  return `
    (
      SELECT count(*) as count,
      ${CLICKHOUSE_PRICE_CALC("response_copy_v3")} as cost
      FROM response_copy_v3
      WHERE (
        response_copy_v3.request_created_at >= now() - INTERVAL {${secondsVal} : Int32} SECOND
      ) AND (
        response_copy_v3.proxy_key_id = {${proxyKeyIdVal} : String}
      )
    ) as x_${index}
  `;
};

export async function checkLimits(
  limits: Database["public"]["Tables"]["helicone_proxy_key_limits"]["Row"][],
  env: Env
): Promise<boolean> {
  const cacheKey = (await hash(JSON.stringify(limits))).substring(0, 32);
  const cached = await env.CACHE_KV.get(cacheKey);
  if (cached) {
    console.log("Using cached limits");
    return cached === "true";
  } else {
    console.log("No cached limits");
  }

  const timeWindows = limits.map((_, i) => generateSubquery(i));
  const query = `SELECT [${timeWindows.join(",")}]`;
  const client = new ClickhouseClientWrapper(env);
  const { data: keyMappings, error } = await client.dbQuery<any>(
    query,
    limits.flatMap((limit) => [
      limit.timewindow_seconds!,
      limit.helicone_proxy_key,
    ])
  );
  if (error) {
    console.error("Error checking limits:", error);
    return false;
  } else {
    console.log("Checked limits:", keyMappings);
  }
  const limitResults = (Object.values(keyMappings?.[0])?.[0] ?? []) as [
    number,
    number
  ][];

  const remappedResults = limitResults.map(([count, cost], index) => {
    const limitId = limits[index].id;
    return { count: +count, cost: +cost, limitId };
  }, {});

  console.log("Remapped results:", remappedResults);
  console.log("Limits:", limits);
  const result = limits.every((limit) => {
    const limitResult = remappedResults.find(
      (result) => result.limitId === limit.id
    );
    if (!limitResult) {
      return false;
    }
    if (limit.cost !== null) {
      console.log("Checking cost:", limitResult.cost, limit.cost);
      return limitResult.cost <= (limit?.cost ?? 0);
    } else if (limit.count !== null) {
      console.log("Checking count:", limitResult.count, limit.count);
      return limitResult.count <= (limit?.count ?? 0);
    } else {
      console.log("No cost or count limit");
      return false;
    }
  });

  await env.CACHE_KV.put(cacheKey, result.toString(), { expirationTtl: 60 });
  return result;
}
