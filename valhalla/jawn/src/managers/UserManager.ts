import {
  UserMetricsQueryParams,
  UserMetricsResult,
} from "../controllers/public/userController";
import { KVCache } from "../lib/cache/kvCache";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { dbQueryClickhouse } from "../lib/shared/db/dbExecute";
import { FilterNode } from "../lib/shared/filters/filterDefs";
import {
  buildFilterClickHouse,
  buildFilterWithAuthClickHouse,
} from "../lib/shared/filters/filters";
import { ok, Result, resultMap } from "../lib/shared/result";
import { SortDirection } from "../lib/shared/sorts/requests/sorts";
import { clickhousePriceCalc } from "../packages/cost";
import { cacheResultCustom } from "../utils/cacheResult";
import { BaseManager } from "./BaseManager";
import {
  getHistogramRowOnKeys,
  HistogramRow,
} from "./helpers/percentileDistributions";

export type PSize = "p50" | "p75" | "p95" | "p99" | "p99.9";

const isValidSortDirection = (sort: SortDirection) => {
  return sort === "asc" || sort === "desc";
};

function assertValidSortDirection(direction: SortDirection) {
  if (!isValidSortDirection(direction)) {
    throw new Error(`Invalid sort direction: ${direction}`);
  }
}
const kv = new KVCache(60); // 1 minute
export interface UserMetric {
  id?: string;
  user_id: string;
  active_for: number;
  first_active: string;
  last_active: string;
  total_requests: number;
  average_requests_per_day_active: number;
  average_tokens_per_request: number;
  cost: number;
  rate_limited_count: number;
}

export type SortLeafUsers = {
  [K in keyof UserMetric]?: SortDirection;
};

const sortMappings: { [K in keyof UserMetric]: string } = {
  user_id: "request.user_id",
  active_for: "active_for",
  last_active: "last_active",
  total_requests: "total_requests",
  average_requests_per_day_active: "average_requests_per_day_active",
  average_tokens_per_request: "average_tokens_per_request",
  first_active: "first_active",
  cost: "cost",
  rate_limited_count: "rate_limited_count",
};

export function buildUserSort(
  sort: SortLeafUsers,
  argsAcc: any[] = []
): {
  orderByString: string;
  argsAcc: any[];
} {
  const sortKeys = Object.keys(sort);
  if (sortKeys.length === 0) {
    argsAcc = argsAcc.concat([sortMappings.last_active]);
    return {
      orderByString: `{val_${argsAcc.length - 1}: String} DESC`,
      argsAcc,
    };
  } else {
    const sortKey = sortKeys[0];
    const sortDirection = sort[sortKey as keyof UserMetric];
    assertValidSortDirection(sortDirection!);
    const sortColumn = sortMappings[sortKey as keyof UserMetric];
    argsAcc = argsAcc.concat([sortColumn]);
    return {
      orderByString: `{val_${argsAcc.length - 1}: Identifier} ${sortDirection}`,
      argsAcc,
    };
  }
}

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
  ): Promise<Result<{ users: UserMetricsResult[]; count: number }, string>> {
    const {
      filter,
      offset,
      limit,
      timeZoneDifferenceMinutes = 0,
      timeFilter,
      sort = {
        last_active: "desc",
      },
    } = queryParams;
    const { organizationId } = this.authParams;
    const { argsAcc, orderByString } = buildUserSort(sort);

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: organizationId,
      argsAcc: argsAcc,
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

    const baseQuery = `
    SELECT
      r.user_id as user_id,
      r.user_id as id,
      count(DISTINCT date_trunc('day', r.request_created_at)) as active_for,
      toDateTime(min(r.request_created_at) ${
        timeZoneDifferenceMinutes > 0
          ? `- INTERVAL '${Math.abs(timeZoneDifferenceMinutes)} minute'`
          : `+ INTERVAL '${timeZoneDifferenceMinutes} minute'`
      }) as first_active,
      toDateTime(max(r.request_created_at) ${
        timeZoneDifferenceMinutes > 0
          ? `- INTERVAL '${Math.abs(timeZoneDifferenceMinutes)} minute'`
          : `+ INTERVAL '${timeZoneDifferenceMinutes} minute'`
      }) as last_active,
      count(r.request_id)::Int32 as total_requests,
      count(r.request_id) / count(DISTINCT date_trunc('day', r.request_created_at)) as average_requests_per_day_active,
      (sum(r.prompt_tokens) + sum(r.completion_tokens)) / count(r.request_id) as average_tokens_per_request,
      sum(r.completion_tokens) as total_completion_tokens,
      sum(r.prompt_tokens) as total_prompt_token,
      (${clickhousePriceCalc("r")}) as cost,
      sum(CASE WHEN r.properties['Helicone-Rate-Limit-Status'] = 'rate_limited' THEN 1 ELSE 0 END) as rate_limited_count
    from request_response_rmt r
    WHERE (${builtFilter.filter})
    GROUP BY r.user_id WITH TOTALS
    HAVING (${havingFilter.filter})
      `;

    const query = `
    ${baseQuery}
    ORDER BY ${orderByString}
    LIMIT ${limit}
    OFFSET ${offset}
        `;

    const countQuery = `
    SELECT
      count(*) as count
    FROM (
      ${baseQuery}
    )
    `;

    const countResult = await cacheResultCustom(
      "userMetricsCountQuery" + organizationId,
      async () =>
        await dbQueryClickhouse<{ count: number }>(
          countQuery,
          builtFilter.argsAcc
        ),
      kv
    );

    const results = await clickhouseDb.dbQuery<{
      id: string;
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

    const users = resultMap(results, (x) =>
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
    if (users.error) {
      return users;
    }
    if (countResult.error) {
      return countResult;
    }

    return ok({
      users: users.data!,
      count: countResult.data?.[0].count ?? 0,
    });
  }
}
