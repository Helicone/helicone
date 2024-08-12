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
    const { nameContains, timezoneDifference } = requestBody;

    if (!isValidTimeZoneDifference(timezoneDifference)) {
      return err("Invalid timezone difference");
    }

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      filter: nameContains
        ? {
            request_response_versioned: {
              properties: {
                "Helicone-Session-Name": {
                  ilike: `'%${nameContains}%'`,
                },
              },
            },
          }
        : "all",
      argsAcc: [],
    });

    const sessionsCountQuery = `
    WITH session_counts AS (
      SELECT
        properties['Helicone-Session-Name'] AS session_name,
        properties['Helicone-Session-Id'] AS session_id,
        count(*) AS row_count
      FROM request_response_versioned
      WHERE ${builtFilter.filter}
      GROUP BY session_name, session_id
    ),
    stats AS (
      SELECT
        min(row_count) AS min_count,
        max(row_count) AS max_count
      FROM session_counts
    ),
    buckets AS (
      SELECT
        floor((row_count - min_count) / ((max_count - min_count) / 10)) AS bucket,
        count(*) AS count
      FROM session_counts, stats
      GROUP BY bucket
    )
    SELECT
      bucket * ((max_count - min_count) / 10) + min_count AS range_start,
      (bucket + 1) * ((max_count - min_count) / 10) + min_count AS range_end,
      count AS value
    FROM buckets, stats
    ORDER BY bucket
    `;
    const sessionCount = await clickhouseDb.dbQuery<HistogramRow>(
      sessionsCountQuery,
      builtFilter.argsAcc
    );
    if (!sessionCount?.data) {
      return err("No session count found");
    }

    const sessionDurationQuery = `
    WITH session_durations AS (
      SELECT
        properties['Helicone-Session-Id'] AS session_id,
        sum(latency) AS duration
      FROM request_response_versioned
      WHERE ${builtFilter.filter}
      GROUP BY session_id
    ),
    stats AS (
      SELECT
        min(duration) AS min_duration,
        max(duration) AS max_duration
      FROM session_durations
    ),
    buckets AS (
      SELECT
        floor((duration - min_duration) / ((max_duration - min_duration) / 10)) AS bucket,
        count(*) AS count
      FROM session_durations, stats
      GROUP BY bucket
    )
    SELECT
      bucket * ((max_duration - min_duration) / 10) + min_duration AS range_start,
      (bucket + 1) * ((max_duration - min_duration) / 10) + min_duration AS range_end,
      count AS value
    FROM buckets, stats
    ORDER BY bucket
    `;

    const sessionDuration = await clickhouseDb.dbQuery<HistogramRow>(
      sessionDurationQuery,
      builtFilter.argsAcc
    );

    if (!sessionDuration?.data) {
      return err("No session duration found");
    }

    const sessionCostQuery = `
    WITH session_costs AS (
      SELECT
        properties['Helicone-Session-Id'] AS session_id,
        ${clickhousePriceCalc("request_response_versioned")} AS cost
      FROM request_response_versioned
      WHERE ${builtFilter.filter}
      GROUP BY session_id
    ),
    stats AS (
      SELECT
        min(cost) AS min_cost,
        max(cost) AS max_cost
      FROM session_costs
    ),
    buckets AS (
      SELECT
        floor((cost - min_cost) / ((max_cost - min_cost) / 10)) AS bucket,
        count(*) AS count
      FROM session_costs, stats
      GROUP BY bucket
    )
    SELECT
      bucket * ((max_cost - min_cost) / 10) + min_cost AS range_start,
      (bucket + 1) * ((max_cost - min_cost) / 10) + min_cost AS range_end,
      count AS value
    FROM buckets, stats
    ORDER BY bucket
    `;

    const sessionCost = await clickhouseDb.dbQuery<HistogramRow>(
      sessionCostQuery,
      builtFilter.argsAcc
    );
    if (!sessionCost?.data) {
      return err("No session cost found");
    }

    return ok({
      session_count: sessionCount.data,
      session_duration: sessionDuration.data,
      session_cost: sessionCost.data,
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
            request_response_versioned: {
              properties: {
                "Helicone-Session-Name": {
                  ilike: `'%${nameContains}%'`,
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
      min(request_response_versioned.request_created_at) ${
        timezoneDifference > 0
          ? `- INTERVAL '${Math.abs(timezoneDifference)} minute'`
          : `+ INTERVAL '${timezoneDifference} minute'`
      } AS created_at,
      ${clickhousePriceCalc("request_response_versioned")} AS total_cost,
      max(request_response_versioned.request_created_at )${
        timezoneDifference > 0
          ? `- INTERVAL '${Math.abs(timezoneDifference)} minute'`
          : `+ INTERVAL '${timezoneDifference} minute'`
      } AS last_used,
      count(DISTINCT properties['Helicone-Session-Id']) AS session_count
    FROM request_response_versioned
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
        request_response_versioned: {
          request_created_at: {
            gt: new Date(timeFilter.startTimeUnixMs),
          },
        },
      },
      {
        request_response_versioned: {
          request_created_at: {
            lt: new Date(timeFilter.endTimeUnixMs),
          },
        },
      },
    ];

    if (sessionName) {
      filters.push({
        request_response_versioned: {
          properties: {
            "Helicone-Session-Name": {
              ilike: `'%${sessionName}%'`,
            },
          },
        },
      });
    }

    if (sessionIdContains) {
      filters.push({
        request_response_versioned: {
          properties: {
            "Helicone-Session-Id": {
              ilike: `'%${sessionIdContains}%'`,
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
      min(request_response_versioned.request_created_at) + INTERVAL ${timezoneDifference} MINUTE AS created_at,
      max(request_response_versioned.request_created_at) + INTERVAL ${timezoneDifference} MINUTE AS latest_request_created_at,
      properties['Helicone-Session-Id'] as session,
      ${clickhousePriceCalc("request_response_versioned")} AS total_cost,
      count(*) AS total_requests,
      sum(request_response_versioned.prompt_tokens) AS prompt_tokens,
      sum(request_response_versioned.completion_tokens) AS completion_tokens
    FROM request_response_versioned
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
}
