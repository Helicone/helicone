import {
  SessionNameQueryParams,
  SessionQueryParams,
} from "../controllers/public/sessionController";
import {
  UserMetricsQueryParams,
  UserMetricsResult,
} from "../controllers/public/userController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams } from "../lib/db/supabase";
import { filterListToTree, FilterNode } from "../lib/shared/filters/filterDefs";
import {
  buildFilterClickHouse,
  buildFilterWithAuthClickHouse,
} from "../lib/shared/filters/filters";
import { err, ok, Result, resultMap } from "../lib/shared/result";
import { clickhousePriceCalc } from "../packages/cost";
import { isValidTimeZoneDifference } from "../utils/helpers";
import { BaseManager } from "./BaseManager";
import {
  getHistogramRowOnKeys,
  HistogramRow,
} from "./helpers/percentileDistributions";

export type PSize = "p50" | "p75" | "p95" | "p99" | "p99.9";

export class UserManager extends BaseManager {
  async getUserMetricsOverview(
    filter: FilterNode,
    pSize: PSize,
    useInterquartile: boolean
  ): Promise<
    Result<{ request_count: HistogramRow[]; user_cost: HistogramRow[] }, string>
  > {
    const { organizationId } = this.authParams;

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: organizationId,
      argsAcc: [],
      filter: filter,
    });

    const requestCountData = await getHistogramRowOnKeys({
      keys: [{ key: "user_id", alias: "user_id" }],
      pSize,
      useInterquartile,
      builtFilter,
      aggregateFunction: "count(*)",
    });

    if (requestCountData.error) {
      return requestCountData;
    }

    const userCostData = await getHistogramRowOnKeys({
      keys: [{ key: "user_id", alias: "user_id" }],
      pSize,
      useInterquartile,
      builtFilter,
      aggregateFunction: clickhousePriceCalc("request_response_rmt"),
    });

    if (userCostData.error) {
      return userCostData;
    }

    return ok({
      request_count: requestCountData.data!,
      user_cost: userCostData.data!,
    });
  }

  async getUserMetrics(
    queryParams: UserMetricsQueryParams
  ): Promise<Result<UserMetricsResult[], string>> {
    const {
      filter,
      offset,
      limit,
      timeZoneDifferenceMinutes = 0,
      timeFilter,
    } = queryParams;
    const { organizationId } = this.authParams;

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: organizationId,
      argsAcc: [],
      filter: {
        left: timeFilter
          ? {
              left: {
                request_response_rmt: {
                  request_created_at: {
                    gt: new Date(timeFilter.startTimeUnixSeconds * 1000),
                  },
                },
              },
              operator: "and",
              right: {
                request_response_rmt: {
                  request_created_at: {
                    lt: new Date(timeFilter.endTimeUnixSeconds * 1000),
                  },
                },
              },
            }
          : "all",
        operator: "and",
        right: filter,
      },
    });

    const havingFilter = buildFilterClickHouse({
      filter,
      having: true,
      argsAcc: builtFilter.argsAcc,
    });

    const query = `
  SELECT
    request_response_rmt.user_id as user_id,
    count(DISTINCT date_trunc('day', request_response_rmt.request_created_at)) as active_for,
    toDateTime(min(request_response_rmt.request_created_at) ${
      timeZoneDifferenceMinutes > 0
        ? `- INTERVAL '${Math.abs(timeZoneDifferenceMinutes)} minute'`
        : `+ INTERVAL '${timeZoneDifferenceMinutes} minute'`
    }) as first_active,
    toDateTime(max(request_response_rmt.request_created_at) ${
      timeZoneDifferenceMinutes > 0
        ? `- INTERVAL '${Math.abs(timeZoneDifferenceMinutes)} minute'`
        : `+ INTERVAL '${timeZoneDifferenceMinutes} minute'`
    }) as last_active,
    count(request_response_rmt.request_id)::Int32 as total_requests,
    count(request_response_rmt.request_id) / count(DISTINCT date_trunc('day', request_response_rmt.request_created_at)) as average_requests_per_day_active,
    (sum(request_response_rmt.prompt_tokens) + sum(request_response_rmt.completion_tokens)) / count(request_response_rmt.request_id) as average_tokens_per_request,
    sum(request_response_rmt.completion_tokens) as total_completion_tokens,
    sum(request_response_rmt.prompt_tokens) as total_prompt_tokens,
    (${clickhousePriceCalc("request_response_rmt")}) as cost
  from request_response_rmt
  WHERE (${builtFilter.filter})
  GROUP BY request_response_rmt.user_id
  HAVING (${havingFilter.filter})
  ORDER BY last_active
  LIMIT ${limit}
  OFFSET ${offset}
    `;

    const results = await clickhouseDb.dbQuery<{
      user_id: string;
      active_for: number;
      first_active: string;
      last_active: string;
      total_requests: number;
      average_requests_per_day_active: number;
      average_tokens_per_request: number;
      total_completion_tokens: number;
      total_prompt_tokens: number;
      cost: number;
    }>(query, builtFilter.argsAcc);

    return resultMap(results, (x) =>
      x.map((y) => ({
        ...y,
        average_requests_per_day_active: +y.average_requests_per_day_active,
        average_tokens_per_request: +y.average_tokens_per_request,
        total_completion_tokens: +y.total_completion_tokens,
        total_prompt_tokens: +y.total_prompt_tokens,
        cost: +y.cost,
        active_for: y.active_for,
        first_active: new Date(y.first_active).toISOString(),
        last_active: new Date(y.last_active).toISOString(),
        total_requests: +y.total_requests,
        user_id: y.user_id,
      }))
    );
  }
}
