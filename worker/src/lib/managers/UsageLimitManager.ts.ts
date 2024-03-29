import { Env, hash } from "../..";
import { Database } from "../../../supabase/database.types";
import { clickhousePriceCalc } from "../../packages/cost";
import { Result, err, ok } from "../../results";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";

// uses Dat trunc
export async function checkLimitsSingle(
  costUSD: number,
  requestCount: number,
  timeGrain: "minute" | "hour" | "day" | "week" | "month",
  organizationId: string,
  env: Env
): Promise<Result<string, string>> {
  if (!organizationId) {
    console.log("No organization ID provided");
    return err("No organization ID provided");
  }
  const client = new ClickhouseClientWrapper(env);
  const { data, error } = await client.dbQuery<{
    count: number;
    cost: number;
  }>(
    `
    SELECT
      count(*) as count,
      ${clickhousePriceCalc("request_response_log")} as cost
    FROM request_response_log
    WHERE (
      request_response_log.request_created_at >= DATE_TRUNC('${timeGrain}', now())
    ) AND (
      request_response_log.organization_id = {val_0 : String}
    )
  `,
    [organizationId]
  );
  if (error || !data) {
    console.error("Error checking limits:", error);
    return err("Error checking limits");
  }
  const { cost, count } = data[0];
  if (cost > costUSD) {
    console.log("Cost exceeded:", cost, costUSD);
    return err("Cost exceeded");
  }
  if (count > requestCount) {
    console.log("Count exceeded:", count, requestCount);
    return err("Count exceeded");
  }

  return ok(
    `OK, within limits {cost: ${cost}/${costUSD}, count: ${count}/${requestCount}}}`
  );
}
const generateSubquery = (index: number) => {
  const secondsVal = `val_${index * 2}`;
  const proxyKeyIdVal = `val_${index * 2 + 1}`;

  return `
    (
      SELECT count(*) as count,
      ${clickhousePriceCalc("request_response_log")} as cost
      FROM request_response_log
      WHERE (
        request_response_log.request_created_at >= now() - INTERVAL {${secondsVal} : Int32} SECOND
      ) AND (
        request_response_log.proxy_key_id = {${proxyKeyIdVal} : String}
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: keyMappings, error } = await client.dbQuery<any>(
    query,
    limits.flatMap((limit) => [
      limit.timewindow_seconds ?? 0,
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
