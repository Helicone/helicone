import { FilterNode } from "@helicone-package/filters/filterDefs";
import { timeFilterToFilterNode } from "@helicone-package/filters/helpers";
import {
  buildFilterWithAuthClickHouse,
  buildFilterClickHouse,
  clickhouseParam,
} from "@helicone-package/filters/filters";
import { Result, resultMap } from "../packages/common/result";
import { dbQueryClickhouse } from "../lib/shared/db/dbExecute";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { BaseManager } from "./BaseManager";
import { AuthParams } from "../packages/common/auth/types";
import moment from "moment";
import {
  isValidTimeFilter,
  isValidTimeIncrement,
  isValidTimeZoneDifference,
} from "./helpers/timeHelpers";
import { KVCache } from "../lib/cache/kvCache";
import { cacheResultCustom } from "../utils/cacheResult";
import { TimeIncrement } from "./helpers/getXOverTime";

// Short cache for request count (5 minutes)
const requestCountCache = new KVCache(5 * 60 * 1000);

// Re-export TimeIncrement for controller use
export type { TimeIncrement };

// Custom DataOverTimeRequest that uses FilterNode (more permissive than RequestClickhouseFilterNode)
export interface MetricsDataOverTimeRequest {
  timeFilter: {
    start: string;
    end: string;
  };
  userFilter: FilterNode;
  dbIncrement: TimeIncrement;
  timeZoneDifference: number;
}

export interface TimeFilter {
  start: Date;
  end: Date;
}

// Response types
export interface RequestsOverTime {
  time: Date;
  count: number;
  status?: number;
}

export interface CostOverTime {
  time: Date;
  cost: number;
}

export interface TokensOverTime {
  time: Date;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface LatencyOverTime {
  time: Date;
  duration: number;
}

export interface TimeToFirstTokenOverTime {
  time: Date;
  ttft: number;
}

export interface UsersOverTime {
  time: Date;
  count: number;
}

export interface ThreatsOverTime {
  time: Date;
  count: number;
}

export interface ErrorOverTime {
  time: Date;
  count: number;
}

export interface TokensPerRequest {
  average_prompt_tokens_per_response: number;
  average_completion_tokens_per_response: number;
  average_total_tokens_per_response: number;
}

export interface ModelMetric {
  model: string;
  total_requests: number;
  total_completion_tokens: number;
  total_prompt_token: number;
  total_tokens: number;
  cost: number;
}

export interface CountryData {
  country: string;
  total_requests: number;
}

export interface Quantiles {
  time: Date;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

function convertDbIncrement(dbIncrement: TimeIncrement): string {
  return dbIncrement === "min" ? "minute" : dbIncrement;
}

function buildFill(
  startDate: Date,
  endDate: Date,
  dbIncrement: TimeIncrement,
  timeZoneDifference: number,
  argsAcc: any[],
): {
  fill: string;
  argsAcc: any[];
} {
  const i = argsAcc.length;
  const startDateVal = buildDateTrunc(
    dbIncrement,
    timeZoneDifference,
    clickhouseParam(i, startDate),
  );
  const endDateVal = buildDateTrunc(
    dbIncrement,
    timeZoneDifference,
    clickhouseParam(i + 1, endDate),
  );

  const fill = `WITH FILL FROM ${startDateVal} to ${endDateVal} + INTERVAL 1 ${convertDbIncrement(
    dbIncrement,
  )} STEP INTERVAL 1 ${convertDbIncrement(dbIncrement)}`;
  return { fill, argsAcc: [...argsAcc, startDate, endDate] };
}

function buildDateTrunc(
  dbIncrement: TimeIncrement,
  timeZoneDifference: number,
  column: string,
): string {
  const minutes = Math.abs(timeZoneDifference);
  const operator = timeZoneDifference >= 0 ? "-" : "+";
  return `toDateTime64(DATE_TRUNC('${convertDbIncrement(dbIncrement)}', ${column} ${operator} INTERVAL ${minutes} minute, 'UTC'), 0, 'UTC')`;
}

export class MetricsManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  // Helper for "over time" queries
  private async getXOverTime<T>(
    {
      timeFilter,
      userFilter,
      dbIncrement,
      timeZoneDifference,
    }: MetricsDataOverTimeRequest,
    countColumn: string,
    groupByColumns: string[] = [],
  ): Promise<
    Result<
      (T & {
        created_at_trunc: Date;
      })[],
      string
    >
  > {
    const startDate = new Date(timeFilter.start);
    const endDate = new Date(timeFilter.end);
    const timeFilterNode: FilterNode = {
      left: {
        request_response_rmt: {
          request_created_at: {
            gte: startDate,
          },
        },
      },
      right: {
        request_response_rmt: {
          request_created_at: {
            lte: endDate,
          },
        },
      },
      operator: "and",
    };
    const filter: FilterNode = {
      left: timeFilterNode,
      right: userFilter,
      operator: "and",
    };

    if (!isValidTimeFilter(timeFilter)) {
      return { data: null, error: "Invalid time filter" };
    }
    if (!isValidTimeIncrement(dbIncrement)) {
      return { data: null, error: "Invalid time increment" };
    }
    if (!isValidTimeZoneDifference(timeZoneDifference)) {
      return { data: null, error: "Invalid time zone difference" };
    }

    const { filter: builtFilter, argsAcc: builtFilterArgsAcc } =
      await buildFilterWithAuthClickHouse({
        org_id: this.authParams.organizationId,
        filter,
        argsAcc: [],
      });
    const { fill, argsAcc } = buildFill(
      startDate,
      endDate,
      dbIncrement,
      timeZoneDifference,
      builtFilterArgsAcc,
    );
    const dateTrunc = buildDateTrunc(
      dbIncrement,
      timeZoneDifference,
      "request_created_at",
    );
    const query = `
    -- getXOverTime
  SELECT
    ${dateTrunc} as created_at_trunc,
    ${groupByColumns.concat([countColumn]).join(", ")}
  FROM request_response_rmt
  WHERE (
    ${builtFilter}
  )
  GROUP BY ${groupByColumns.concat([dateTrunc]).join(", ")}
  ORDER BY ${dateTrunc} ASC ${fill}
  `;

    type ResultType = T & {
      created_at_trunc: Date;
    };
    return resultMap(await dbQueryClickhouse<ResultType>(query, argsAcc), (d) =>
      d.map((r) => ({
        ...r,
        created_at_trunc: new Date(
          moment
            .utc(r.created_at_trunc, "YYYY-MM-DD HH:mm:ss")
            .toDate()
            .getTime() +
            timeZoneDifference * 60 * 1000,
        ),
      })),
    );
  }

  // ============== AGGREGATE METRICS ==============

  async getTotalRequests(
    filter: FilterNode,
    timeFilter: TimeFilter,
  ): Promise<Result<number, string>> {
    const { filter: filterString, argsAcc } =
      await buildFilterWithAuthClickHouse({
        org_id: this.authParams.organizationId,
        filter: {
          left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
          right: filter,
          operator: "and",
        },
        argsAcc: [],
      });
    const query = `
    WITH total_count AS (
      SELECT count(*) as count
      FROM request_response_rmt
      WHERE (
        (${filterString})
      )
    )
    SELECT coalesce(sum(count), 0) as count
    FROM total_count
  `;

    return resultMap(
      await dbQueryClickhouse<{ count: number }>(query, argsAcc),
      (d) => +d[0].count,
    );
  }

  async getTotalCost(
    filter: FilterNode,
    timeFilter: TimeFilter,
  ): Promise<Result<number, string>> {
    const { filter: filterString, argsAcc } =
      await buildFilterWithAuthClickHouse({
        org_id: this.authParams.organizationId,
        filter: {
          left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
          right: filter,
          operator: "and",
        },
        argsAcc: [],
      });
    const query = `
    WITH total_cost AS (
      SELECT sum(cost) / ${COST_PRECISION_MULTIPLIER} as cost
      FROM request_response_rmt
      WHERE (
        (${filterString})
      )
    )
    SELECT coalesce(sum(cost), 0) as cost
    FROM total_cost
  `;

    const res = await dbQueryClickhouse<{ cost: number }>(query, argsAcc);
    return resultMap(res, (d) => d[0].cost);
  }

  async getAverageLatency(
    filter: FilterNode,
    timeFilter: TimeFilter,
  ): Promise<Result<number, string>> {
    const { filter: filterString, argsAcc } =
      await buildFilterWithAuthClickHouse({
        org_id: this.authParams.organizationId,
        filter: {
          left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
          right: filter,
          operator: "and",
        },
        argsAcc: [],
      });
    const query = `
    WITH total_count AS (
      SELECT
        count(*) as count,
        sum(request_response_rmt.latency) as total_latency
      FROM request_response_rmt
      WHERE (
        (${filterString})
      )
    )
    SELECT CASE
      WHEN count = 0 THEN 0
      ELSE total_latency / count
    END as average_latency
    FROM total_count
  `;

    const res = await dbQueryClickhouse<{ average_latency: number }>(
      query,
      argsAcc,
    );
    return resultMap(res, (d) => +d[0].average_latency);
  }

  async getAverageTimeToFirstToken(
    filter: FilterNode,
    timeFilter: TimeFilter,
  ): Promise<Result<number, string>> {
    const { filter: filterString, argsAcc } =
      await buildFilterWithAuthClickHouse({
        org_id: this.authParams.organizationId,
        filter: {
          left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
          right: filter,
          operator: "and",
        },
        argsAcc: [],
      });
    const query = `
    WITH total_count AS (
      SELECT
        count(*) as count,
        sum(request_response_rmt.time_to_first_token) as total_time_to_first_token
      FROM request_response_rmt
      WHERE (
        (${filterString} and request_response_rmt.time_to_first_token > 0)
      )
    )
    SELECT CASE
      WHEN count = 0 THEN 0
      ELSE total_time_to_first_token / count
    END as average_time_to_first_token
    FROM total_count
  `;

    const res = await dbQueryClickhouse<{
      average_time_to_first_token: number;
    }>(query, argsAcc);
    return resultMap(res, (d) => +d[0].average_time_to_first_token);
  }

  async getAverageTokensPerRequest(
    filter: FilterNode,
    timeFilter: TimeFilter,
  ): Promise<Result<TokensPerRequest, string>> {
    const { filter: filterString, argsAcc } =
      await buildFilterWithAuthClickHouse({
        org_id: this.authParams.organizationId,
        filter: {
          left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
          right: filter,
          operator: "and",
        },
        argsAcc: [],
      });
    const query = `
    WITH total_count AS (
      SELECT
        count(*) as count,
        sum(request_response_rmt.prompt_tokens) as sum_prompt_tokens,
        sum(request_response_rmt.completion_tokens) as sum_completion_tokens
      FROM request_response_rmt
      WHERE (
        (${filterString})
      )
    )
    SELECT CASE
      WHEN count = 0 THEN 0
      ELSE sum_prompt_tokens / count
    END as average_prompt_tokens_per_response,
    CASE
      WHEN count = 0 THEN 0
      ELSE sum_completion_tokens / count
    END as average_completion_tokens_per_response,
    CASE
      WHEN count = 0 THEN 0
      ELSE (sum_prompt_tokens + sum_completion_tokens) / count
    END as average_total_tokens_per_response
    FROM total_count
  `;

    const res = await dbQueryClickhouse<{
      average_prompt_tokens_per_response: number;
      average_completion_tokens_per_response: number;
      average_total_tokens_per_response: number;
    }>(query, argsAcc);

    return resultMap(res, (d) => ({
      average_prompt_tokens_per_response:
        +d[0].average_prompt_tokens_per_response,
      average_completion_tokens_per_response:
        +d[0].average_completion_tokens_per_response,
      average_total_tokens_per_response:
        +d[0].average_total_tokens_per_response,
    }));
  }

  async getTotalThreats(
    filter: FilterNode,
    timeFilter: TimeFilter,
  ): Promise<Result<number, string>> {
    const { filter: filterString, argsAcc } =
      await buildFilterWithAuthClickHouse({
        org_id: this.authParams.organizationId,
        filter: {
          left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
          right: filter,
          operator: "and",
        },
        argsAcc: [],
      });
    const query = `
      SELECT
          countIf(request_response_rmt.threat = true) AS threats
      FROM request_response_rmt
      WHERE (
          ${filterString}
      )
    `;

    const res = await dbQueryClickhouse<{ threats: number }>(query, argsAcc);
    return resultMap(res, (d) => +d[0].threats);
  }

  async getActiveUsers(
    filter: FilterNode,
    timeFilter: TimeFilter,
  ): Promise<Result<number, string>> {
    const { filter: filterString, argsAcc } =
      await buildFilterWithAuthClickHouse({
        org_id: this.authParams.organizationId,
        filter: {
          left: timeFilterToFilterNode(timeFilter, "request_response_rmt"),
          right: filter,
          operator: "and",
        },
        argsAcc: [],
      });
    const query = `
      SELECT
          count(DISTINCT request_response_rmt.user_id) AS users
      FROM request_response_rmt
      WHERE (
          ${filterString}
      )
    `;

    const res = await dbQueryClickhouse<{ users: number }>(query, argsAcc);
    return resultMap(res, (d) => +d[0].users);
  }

  // ============== OVER TIME METRICS ==============

  async getRequestsOverTime(
    data: MetricsDataOverTimeRequest,
    groupByColumns: string[] = [],
  ): Promise<Result<RequestsOverTime[], string>> {
    const res = await this.getXOverTime<{
      count: number;
      status: number;
    }>(data, "count(*) as count", groupByColumns);
    return resultMap(res, (resData) =>
      resData.map((d) => ({
        time: new Date(d.created_at_trunc),
        count: Number(d.count),
        status: Number(d.status),
      })),
    );
  }

  async getCostOverTime(
    data: MetricsDataOverTimeRequest,
  ): Promise<Result<CostOverTime[], string>> {
    const res = await this.getXOverTime<{
      cost: number;
    }>(data, `sum(cost) / ${COST_PRECISION_MULTIPLIER} AS cost`);
    return resultMap(res, (resData) =>
      resData.map((d) => ({
        time: new Date(d.created_at_trunc),
        cost: Number(d.cost),
      })),
    );
  }

  async getTokensOverTime(
    data: MetricsDataOverTimeRequest,
  ): Promise<Result<TokensOverTime[], string>> {
    const res = await this.getXOverTime<{
      prompt_tokens: number;
      completion_tokens: number;
    }>(
      data,
      `sum(request_response_rmt.prompt_tokens) AS prompt_tokens,
       sum(request_response_rmt.completion_tokens) AS completion_tokens`,
    );
    return resultMap(res, (resData) =>
      resData.map((d) => ({
        time: new Date(d.created_at_trunc),
        prompt_tokens: Number(d.prompt_tokens),
        completion_tokens: Number(d.completion_tokens),
      })),
    );
  }

  async getLatencyOverTime(
    data: MetricsDataOverTimeRequest,
  ): Promise<Result<LatencyOverTime[], string>> {
    // Filter out batch models from latency calculations
    const batchModelFilter: FilterNode = {
      request_response_rmt: {
        model: {
          "not-contains": "-batch",
        },
      },
    };

    const combinedFilter: FilterNode = {
      left: data.userFilter,
      operator: "and",
      right: batchModelFilter,
    };

    const res = await this.getXOverTime<{
      latency: number;
    }>(
      { ...data, userFilter: combinedFilter },
      "avg(request_response_rmt.latency) as latency",
    );
    return resultMap(res, (resData) =>
      resData.map((d) => ({
        time: new Date(d.created_at_trunc),
        duration: Number(d.latency),
      })),
    );
  }

  async getTimeToFirstTokenOverTime(
    data: MetricsDataOverTimeRequest,
  ): Promise<Result<TimeToFirstTokenOverTime[], string>> {
    const res = await this.getXOverTime<{
      ttft: number;
    }>(data, "avg(request_response_rmt.time_to_first_token) AS ttft");
    return resultMap(res, (resData) =>
      resData.map((d) => ({
        time: new Date(d.created_at_trunc),
        ttft: Number(d.ttft),
      })),
    );
  }

  async getUsersOverTime(
    data: MetricsDataOverTimeRequest,
  ): Promise<Result<UsersOverTime[], string>> {
    const res = await this.getXOverTime<{
      users: number;
    }>(data, "count(DISTINCT request_response_rmt.user_id) AS users");
    return resultMap(res, (resData) =>
      resData.map((d) => ({
        time: new Date(d.created_at_trunc),
        count: Number(d.users),
      })),
    );
  }

  async getThreatsOverTime(
    data: MetricsDataOverTimeRequest,
  ): Promise<Result<ThreatsOverTime[], string>> {
    const res = await this.getXOverTime<{
      threats: number;
    }>(data, "countIf(request_response_rmt.threat = true) AS threats");
    return resultMap(res, (resData) =>
      resData.map((d) => ({
        time: new Date(d.created_at_trunc),
        count: Number(d.threats),
      })),
    );
  }

  async getErrorsOverTime(
    data: MetricsDataOverTimeRequest,
  ): Promise<Result<ErrorOverTime[], string>> {
    // Filter for non-200 status codes
    const errorFilter: FilterNode = {
      left: data.userFilter,
      operator: "and",
      right: {
        request_response_rmt: {
          status: {
            "not-equals": 200,
          },
        },
      },
    };

    const res = await this.getXOverTime<{
      count: number;
    }>({ ...data, userFilter: errorFilter }, "count(*) as count");
    return resultMap(res, (resData) =>
      resData.map((d) => ({
        time: new Date(d.created_at_trunc),
        count: Number(d.count),
      })),
    );
  }

  async getRequestStatusOverTime(
    data: MetricsDataOverTimeRequest,
  ): Promise<Result<RequestsOverTime[], string>> {
    return this.getRequestsOverTime(data, [
      "request_response_rmt.status as status",
    ]);
  }

  // ============== REQUEST COUNT (CACHED) ==============

  async getRequestCount(
    filter: FilterNode,
    isCached: boolean = false,
  ): Promise<Result<number, string>> {
    const cacheKey = `requestCount:${this.authParams.organizationId}:${JSON.stringify(filter)}:${isCached}`;

    return cacheResultCustom<number, string>(
      cacheKey,
      async (): Promise<Result<number, string>> => {
        const builtFilter = await buildFilterWithAuthClickHouse({
          org_id: this.authParams.organizationId,
          argsAcc: [],
          filter,
        });

        const query = `
        SELECT
          count(DISTINCT request_response_rmt.request_id) as count
        from request_response_rmt
        WHERE (${builtFilter.filter})
        ${isCached ? "AND cache_enabled = 1" : ""}
        `;

        const result = await dbQueryClickhouse<{ count: number }>(
          query,
          builtFilter.argsAcc,
        );

        if (result.error !== null) {
          return { data: null, error: result.error };
        }

        return { data: result.data![0].count, error: null };
      },
      requestCountCache,
    );
  }

  // ============== MODEL METRICS ==============

  async getModelMetrics(
    filter: FilterNode,
    timeFilter: TimeFilter,
    offset: number,
    limit: number,
  ): Promise<Result<ModelMetric[], string>> {
    if (isNaN(offset) || isNaN(limit)) {
      return { data: null, error: "Invalid offset or limit" };
    }

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      argsAcc: [],
      filter: {
        left: filter,
        operator: "and",
        right: {
          left: {
            request_response_rmt: {
              request_created_at: {
                gte: timeFilter.start,
              },
            },
          },
          operator: "and",
          right: {
            request_response_rmt: {
              request_created_at: {
                lte: timeFilter.end,
              },
            },
          },
        },
      },
    });

    const havingFilter = buildFilterClickHouse({
      filter,
      having: true,
      argsAcc: builtFilter.argsAcc,
    });

    const query = `
    SELECT
      request_response_rmt.model as model,
      count(DISTINCT request_id) as total_requests,
      sum(request_response_rmt.completion_tokens) as total_completion_tokens,
      sum(request_response_rmt.prompt_tokens) as total_prompt_token,
      sum(request_response_rmt.prompt_tokens) + sum(request_response_rmt.completion_tokens) as total_tokens,
      sum(cost) / ${COST_PRECISION_MULTIPLIER} as cost
    from request_response_rmt
    WHERE (${builtFilter.filter})
    GROUP BY request_response_rmt.model
    HAVING (${havingFilter.filter})
    ORDER BY total_requests DESC
    LIMIT ${limit}
    OFFSET ${offset}
    `;

    return dbQueryClickhouse<ModelMetric>(query, havingFilter.argsAcc);
  }

  // ============== COUNTRY DATA ==============

  async getCountryMetrics(
    filter: FilterNode,
    timeFilter: TimeFilter,
    offset: number,
    limit: number,
  ): Promise<Result<CountryData[], string>> {
    if (isNaN(offset) || isNaN(limit)) {
      return { data: null, error: "Invalid offset or limit" };
    }

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      argsAcc: [],
      filter: {
        left: filter,
        operator: "and",
        right: {
          left: {
            request_response_rmt: {
              request_created_at: {
                gte: timeFilter.start,
              },
            },
          },
          operator: "and",
          right: {
            request_response_rmt: {
              request_created_at: {
                lte: timeFilter.end,
              },
            },
          },
        },
      },
    });

    const query = `
    SELECT
      country_code as country,
      count() as total_requests
    FROM
      request_response_rmt
    WHERE
      ${builtFilter.filter} AND country_code IS NOT NULL
    GROUP BY
      request_response_rmt.country_code
    ORDER BY
      total_requests DESC
    LIMIT
      ${limit}
    OFFSET
      ${offset}
    `;

    return dbQueryClickhouse<CountryData>(query, builtFilter.argsAcc);
  }

  // ============== QUANTILES ==============

  async getQuantiles(
    data: MetricsDataOverTimeRequest,
    metric: string,
  ): Promise<Result<Quantiles[], string>> {
    let query;

    switch (metric) {
      case "total_tokens":
        query = `quantile(0.75)(completion_tokens + prompt_tokens) as P75,
        quantile(0.90)(completion_tokens + prompt_tokens) as P90,
        quantile(0.95)(completion_tokens + prompt_tokens) as P95,
        quantile(0.99)(completion_tokens + prompt_tokens) as P99`;
        break;
      default:
        query = `quantile(0.75)(${metric}) as P75,
        quantile(0.90)(${metric}) as P90,
        quantile(0.95)(${metric}) as P95,
        quantile(0.99)(${metric}) as P99`;
    }

    const res = await this.getXOverTime<{
      P75: number;
      P90: number;
      P95: number;
      P99: number;
    }>(data, query);

    return resultMap(res, (resData) =>
      resData.map((d) => ({
        time: new Date(d.created_at_trunc),
        p75: Number(d.P75),
        p90: Number(d.P90),
        p95: Number(d.P95),
        p99: Number(d.P99),
      })),
    );
  }
}
