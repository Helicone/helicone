import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { Database } from "../lib/db/database.types";
import { Result, err, ok } from "../lib/shared/result";
import { clickhousePriceCalc } from "../packages/cost";
import { hashAuth } from "../utils/hash";
import { redisClient } from "../lib/clients/redisClient";

export class UsageLimitManager {
  // uses Dat trunc
  async checkLimitsSingle(
    costUSD: number,
    requestCount: number,
    timeGrain: "minute" | "hour" | "day" | "week" | "month",
    organizationId: string
  ): Promise<Result<string, string>> {
    if (!organizationId) {
      console.log("No organization ID provided");
      return err("No organization ID provided");
    }
    const { data, error } = await clickhouseDb.dbQuery<{
      count: number;
      cost: number;
    }>(
      `
    SELECT
      count(*) as count,
      ${clickhousePriceCalc("request_response_rmt")} as cost
    FROM request_response_rmt
    WHERE (
      request_response_rmt.request_created_at >= DATE_TRUNC('${timeGrain}', now())
    ) AND (
      request_response_rmt.organization_id = {val_0 : String}
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

  generateSubquery = (index: number) => {
    const secondsVal = `val_${index * 2}`;
    const proxyKeyIdVal = `val_${index * 2 + 1}`;

    return `
    (
      SELECT count(*) as count,
      ${clickhousePriceCalc("request_response_rmt")} as cost
      FROM request_response_rmt
      WHERE (
        request_response_rmt.request_created_at >= now() - INTERVAL {${secondsVal} : Int32} SECOND
      ) AND (
        request_response_rmt.proxy_key_id = {${proxyKeyIdVal} : String}
      )
    ) as x_${index}
  `;
  };

  // TODO: add cache
  async checkLimits(
    limits: Database["public"]["Tables"]["helicone_proxy_key_limits"]["Row"][]
  ): Promise<boolean> {
    const cacheKey = (await hashAuth(JSON.stringify(limits))).substring(0, 32);
    const cached = await redisClient?.get(cacheKey);
    if (cached) {
      console.log("Using cached limits");
      return cached === "true";
    } else {
      console.log("No cached limits");
    }

    const timeWindows = limits.map((_, i) => this.generateSubquery(i));
    const query = `SELECT [${timeWindows.join(",")}]`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: keyMappings, error } = await clickhouseDb.dbQuery<any>(
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

    await redisClient?.set(cacheKey, result.toString(), "EX", 3600);
    return result;
  }
}

export const usageLimitManager = new UsageLimitManager();
