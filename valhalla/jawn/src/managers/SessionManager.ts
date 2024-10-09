import {
  SessionNameQueryParams,
  SessionQueryParams,
} from "../controllers/public/sessionController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams } from "../lib/db/supabase";
import { filterListToTree, FilterNode } from "../lib/shared/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../lib/shared/filters/filters";
import { err, ok, Result, resultMap } from "../lib/shared/result";
import { clickhousePriceCalc } from "../packages/cost";
import { isValidTimeZoneDifference } from "../utils/helpers";
import { RequestManager } from "./request/RequestManager";

export interface SessionResult {
  created_at: string;
  latest_request_created_at: string;
  session: string;
  total_cost: number;
  total_requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface SessionNameResult {
  name: string;
  created_at: string;
  total_cost: number;
  last_used: string;
  first_used: string;
  session_count: number;
}

export interface HistogramRow {
  range_start: string;
  range_end: string;
  value: number;
}

export interface SessionMetrics {
  session_count: HistogramRow[];
  session_duration: HistogramRow[];
  session_cost: HistogramRow[];
}

export class SessionManager {
  constructor(private authParams: AuthParams) {}

  async getMetrics(
    requestBody: SessionNameQueryParams
  ): Promise<Result<SessionMetrics, string>> {
    const { nameContains, timezoneDifference, useInterquartile, pSize } =
      requestBody;

    if (!isValidTimeZoneDifference(timezoneDifference)) {
      return err("Invalid timezone difference");
    }

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      filter: nameContains
        ? {
            request_response_rmt: {
              properties: {
                "Helicone-Session-Name": {
                  ilike: `%${nameContains}%`,
                },
              },
            },
          }
        : "all",
      argsAcc: [],
    });

    const SIZES_TO_PERCENTILES = {
      p50: "0.5",
      p75: "0.75",
      p95: "0.95",
      p99: "0.99",
      "p99.9": "0.999",
    };

    const upperPercentile = SIZES_TO_PERCENTILES[pSize ?? "p75"];
    const lowerPercentile = useInterquartile
      ? (1 - parseFloat(upperPercentile)).toString()
      : upperPercentile;

    const buildPercentileClause = (metric: string) =>
      useInterquartile
        ? `quantile(${lowerPercentile})(${metric}) AS lower_bound,
         quantile(${upperPercentile})(${metric}) AS upper_bound`
        : `quantile(${upperPercentile})(${metric}) AS p_value`;

    const buildWhereClause = (metric: string) =>
      useInterquartile
        ? `${metric} BETWEEN lower_bound AND upper_bound`
        : `${metric} <= p_value`;

    const sessionsCountQuery = `
WITH session_counts AS (
  SELECT
    properties['Helicone-Session-Name'] AS session_name,
    properties['Helicone-Session-Id'] AS session_id,
    count(*) AS row_count
  FROM request_response_rmt
  WHERE ${builtFilter.filter}
  GROUP BY session_name, session_id
),
percentiles AS (
  SELECT
    ${buildPercentileClause("row_count")}
  FROM session_counts
)
SELECT
  arrayJoin(histogram(10)(row_count)) AS hist
FROM session_counts, percentiles
WHERE ${buildWhereClause("row_count")}
`;

    const sessionCount = await clickhouseDb.dbQuery<{
      hist: [number, number, number];
    }>(sessionsCountQuery, builtFilter.argsAcc);

    if (!sessionCount?.data) {
      return err("No session count found");
    }

    const histogramData: HistogramRow[] = sessionCount.data.map((row) => ({
      range_start: row.hist[0].toString(),
      range_end: row.hist[1].toString(),
      value: row.hist[2],
    }));

    const sessionDurationQuery = `
WITH session_durations AS (
  SELECT
    properties['Helicone-Session-Id'] AS session_id,
    dateDiff('second', min(request_response_rmt.request_created_at), max(request_response_rmt.request_created_at)) AS duration
  FROM request_response_rmt
  WHERE ${builtFilter.filter}
  GROUP BY session_id
),
percentiles AS (
  SELECT
    ${buildPercentileClause("duration")}
  FROM session_durations
)
SELECT
  arrayJoin(histogram(10)(duration)) AS hist
FROM session_durations, percentiles
WHERE ${buildWhereClause("duration")}
`;

    const sessionDuration = await clickhouseDb.dbQuery<{
      hist: [number, number, number];
    }>(sessionDurationQuery, builtFilter.argsAcc);

    if (!sessionDuration?.data) {
      return err("No session duration found");
    }

    const sessionCostQuery = `
    WITH session_costs AS (
      SELECT
        properties['Helicone-Session-Id'] AS session_id,
        ${clickhousePriceCalc("request_response_rmt")} AS cost
      FROM request_response_rmt
      WHERE ${builtFilter.filter}
      GROUP BY session_id
    ),
    percentiles AS (
      SELECT
        ${buildPercentileClause("cost")}
      FROM session_costs
    )
    SELECT
      arrayJoin(histogram(10)(cost)) AS hist
    FROM session_costs, percentiles
    WHERE ${buildWhereClause("cost")}
    `;

    const sessionCost = await clickhouseDb.dbQuery<{
      hist: [number, number, number];
    }>(sessionCostQuery, builtFilter.argsAcc);

    if (!sessionCost?.data) {
      return err("No session cost found");
    }

    const sessionCostData: HistogramRow[] = sessionCost.data.map((row) => ({
      range_start: row.hist[0].toString(),
      range_end: row.hist[1].toString(),
      value: row.hist[2],
    }));

    return ok({
      session_count: histogramData,
      session_duration: sessionDuration.data.map((row) => ({
        range_start: row.hist[0].toString(),
        range_end: row.hist[1].toString(),
        value: row.hist[2],
      })),
      session_cost: sessionCostData,
    });
  }

  async getSessionNames(
    requestBody: SessionNameQueryParams
  ): Promise<Result<SessionNameResult[], string>> {
    const { nameContains, timezoneDifference } = requestBody;

    if (!isValidTimeZoneDifference(timezoneDifference)) {
      return err("Invalid timezone difference");
    }

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      filter: nameContains
        ? {
            request_response_rmt: {
              properties: {
                "Helicone-Session-Name": {
                  ilike: `%${nameContains}%`,
                },
              },
            },
          }
        : "all",
      argsAcc: [],
    });

    const query = `
    SELECT 
      properties['Helicone-Session-Name'] as name,
      min(request_response_rmt.request_created_at) ${
        timezoneDifference > 0
          ? `- INTERVAL '${Math.abs(timezoneDifference)} minute'`
          : `+ INTERVAL '${timezoneDifference} minute'`
      } AS created_at,
      ${clickhousePriceCalc("request_response_rmt")} AS total_cost,
      max(request_response_rmt.request_created_at )${
        timezoneDifference > 0
          ? `- INTERVAL '${Math.abs(timezoneDifference)} minute'`
          : `+ INTERVAL '${timezoneDifference} minute'`
      } AS last_used,
      min(request_response_rmt.request_created_at) ${
        timezoneDifference > 0
          ? `- INTERVAL '${Math.abs(timezoneDifference)} minute'`
          : `+ INTERVAL '${timezoneDifference} minute'`
      } AS first_used,
      count(DISTINCT properties['Helicone-Session-Id']) AS session_count
    FROM request_response_rmt
    WHERE (
      has(properties, 'Helicone-Session-Id')
      AND
      ${builtFilter.filter}
    )
    GROUP BY properties['Helicone-Session-Name']
    `;

    const results = await clickhouseDb.dbQuery<SessionNameResult>(
      query,
      builtFilter.argsAcc
    );

    return resultMap(results, (x) =>
      x.map((y) => ({
        ...y,
        total_cost: +y.total_cost,
      }))
    );
  }

  async getSessions(
    requestBody: SessionQueryParams
  ): Promise<Result<SessionResult[], string>> {
    const { sessionIdContains, timeFilter, sessionName, timezoneDifference } =
      requestBody;

    if (!isValidTimeZoneDifference(timezoneDifference)) {
      return err("Invalid timezone difference");
    }

    const filters: FilterNode[] = [
      {
        request_response_rmt: {
          request_created_at: {
            gt: new Date(timeFilter.startTimeUnixMs),
          },
        },
      },
      {
        request_response_rmt: {
          request_created_at: {
            lt: new Date(timeFilter.endTimeUnixMs),
          },
        },
      },
    ];

    if (sessionName) {
      filters.push({
        request_response_rmt: {
          properties: {
            "Helicone-Session-Name": {
              equals: sessionName,
            },
          },
        },
      });
    }

    if (sessionIdContains) {
      filters.push({
        request_response_rmt: {
          properties: {
            "Helicone-Session-Id": {
              ilike: `%${sessionIdContains}%`,
            },
          },
        },
      });
    }

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      filter: filterListToTree(filters, "and"),
      argsAcc: [],
    });

    // Step 1 get all the properties given this filter
    const query = `
    SELECT 
      min(request_response_rmt.request_created_at) + INTERVAL ${timezoneDifference} MINUTE AS created_at,
      max(request_response_rmt.request_created_at) + INTERVAL ${timezoneDifference} MINUTE AS latest_request_created_at,
      properties['Helicone-Session-Id'] as session,
      ${clickhousePriceCalc("request_response_rmt")} AS total_cost,
      count(*) AS total_requests,
      sum(request_response_rmt.prompt_tokens) AS prompt_tokens,
      sum(request_response_rmt.completion_tokens) AS completion_tokens
    FROM request_response_rmt
    WHERE (
        has(properties, 'Helicone-Session-Id')
        ${sessionName ? "" : "AND NOT has(properties, 'Helicone-Session-Name')"}
        AND (
          ${builtFilter.filter}
        )
    )
    GROUP BY properties['Helicone-Session-Id']
    ORDER BY created_at DESC
    LIMIT 50
    `;

    const results = await clickhouseDb.dbQuery<SessionResult>(
      query,
      builtFilter.argsAcc
    );

    return resultMap(results, (x) =>
      x.map((y) => ({
        ...y,
        completion_tokens: +y.completion_tokens,
        prompt_tokens: +y.prompt_tokens,
        total_tokens: +y.completion_tokens + +y.prompt_tokens,
      }))
    );
  }

  async updateSessionFeedback(
    sessionId: string,
    rating: boolean
  ): Promise<Result<null, string>> {
    const query = `
    SELECT request_id
    FROM request_response_rmt
    WHERE properties['Helicone-Session-Id'] = '${sessionId}'
    ORDER BY request_created_at ASC
    LIMIT 1
    `;

    console.log({ query });

    const results = await clickhouseDb.dbQuery<{ request_id: string }>(
      query,
      []
    );

    console.log({ results });

    if (results.error || !results.data) {
      return err("No request found");
    }

    const requestManager = new RequestManager(this.authParams);
    console.log({ id: results.data[0].request_id });
    const res = await requestManager.addPropertyToRequest(
      results.data[0].request_id,
      "Helicone-Session-Feedback",
      rating ? "1" : "0"
    );

    console.log({ res });

    if (res.error) {
      return err(res.error);
    }

    return ok(null);
  }
}
