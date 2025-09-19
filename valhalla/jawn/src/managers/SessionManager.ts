import {
  SessionNameQueryParams,
  SessionQueryParams,
  SessionMetricsQueryParams,
} from "../controllers/public/sessionController";
import { clickhouseDb, Tags } from "../lib/db/ClickhouseWrapper";
import { dbExecute, printRunnableQuery } from "../lib/shared/db/dbExecute";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { filterListToTree } from "@helicone-package/filters/helpers";
import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { TimeFilterMs } from "@helicone-package/filters/filterDefs";
import { AuthParams } from "../packages/common/auth/types";
import { err, ok, Result, resultMap } from "../packages/common/result";
import { TagType } from "../packages/common/sessions/tags";
import { isValidTimeZoneDifference } from "../utils/helpers";
import {
  getHistogramRowOnKeys,
  HistogramRow,
  getAveragePerSession,
  AverageRow,
} from "./helpers/percentileDistributions";
import { RequestManager } from "./request/RequestManager";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";

export interface SessionResult {
  created_at: string;
  latest_request_created_at: string;
  session_id: string;
  session_name: string;
  total_cost: number;
  total_requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  avg_latency: number;
}

export interface SessionNameResult {
  name: string;
  created_at: string;
  last_used: string;
  first_used: string;
  session_count: number;
  avg_latency: number;
}

export interface SessionMetrics {
  session_count: HistogramRow[];
  session_duration: HistogramRow[];
  session_cost: HistogramRow[];
  average: {
    session_count: AverageRow[];
    session_duration: AverageRow[];
    session_cost: AverageRow[];
  };
}

export class SessionManager {
  constructor(private authParams: AuthParams) {}

  async getMetrics(
    requestBody: SessionMetricsQueryParams
  ): Promise<Result<SessionMetrics, string>> {
    const {
      nameContains,
      timezoneDifference,
      useInterquartile,
      pSize,
      timeFilter,
      filter,
    } = requestBody;

    const filters: FilterNode[] = [
      ...(timeFilter ? timeFilterNodes(timeFilter) : []),
      ...(filter ? [filter] : []),
    ];

    if (nameContains) {
      filters.push({
        request_response_rmt: {
          properties: {
            "Helicone-Session-Name": {
              equals: nameContains,
            },
          },
        },
      });
    }

    if (!isValidTimeZoneDifference(timezoneDifference)) {
      return err("Invalid timezone difference");
    }

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      filter: filterListToTree(filters, "and"),
      argsAcc: [],
    });

    const havingFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      filter: filterListToTree(filters, "and"),
      argsAcc: [],
      having: true,
    });

    const histogramData = await getHistogramRowOnKeys({
      keys: [
        { key: "properties['Helicone-Session-Name']", alias: "session_name" },
        { key: "properties['Helicone-Session-Id']", alias: "session_id" },
      ],
      pSize: pSize ?? "p75",
      useInterquartile: useInterquartile ?? false,
      builtFilter,
      aggregateFunction: "count(*)",
    });

    if (histogramData.error) {
      return histogramData;
    }

    const sessionDurationData = await getHistogramRowOnKeys({
      keys: [{ key: "properties['Helicone-Session-Id']", alias: "session_id" }],
      pSize: requestBody.pSize ?? "p75",
      useInterquartile: requestBody.useInterquartile ?? false,
      builtFilter,
      aggregateFunction:
        "dateDiff('second', min(request_response_rmt.request_created_at), max(request_response_rmt.request_created_at))",
    });

    if (sessionDurationData.error) {
      return sessionDurationData;
    }

    const sessionCostData = await getHistogramRowOnKeys({
      keys: [{ key: "properties['Helicone-Session-Id']", alias: "session_id" }],
      pSize: requestBody.pSize ?? "p75",
      useInterquartile: requestBody.useInterquartile ?? false,
      builtFilter,
      aggregateFunction: `sum(cost) / ${COST_PRECISION_MULTIPLIER}`,
    });

    const averageResults = await Promise.all([
      getAveragePerSession({
        key: { key: "properties['Helicone-Session-Id']", alias: "cost" },
        builtFilter,
        aggregateFunction: `sum(cost) / ${COST_PRECISION_MULTIPLIER}`,
      }),
      getAveragePerSession({
        key: { key: "properties['Helicone-Session-Id']", alias: "duration" },
        builtFilter,
        aggregateFunction:
          "dateDiff('second', min(request_response_rmt.request_created_at), max(request_response_rmt.request_created_at))",
      }),
      getAveragePerSession({
        key: { key: "properties['Helicone-Session-Id']", alias: "count" },
        builtFilter,
        aggregateFunction: "count(*)",
      }),
    ]);

    if (sessionCostData.error) {
      return sessionCostData;
    }

    // Check for errors in each average result
    for (const result of averageResults) {
      if (result.error) {
        return result;
      }
    }

    return ok({
      session_count: histogramData.data!,
      session_duration: sessionDurationData.data!,
      session_cost: sessionCostData.data!,
      average: {
        session_cost: averageResults[0].data!,
        session_duration: averageResults[1].data!,
        session_count: averageResults[2].data!,
      },
    });
  }

  async getSessionNames(
    requestBody: SessionNameQueryParams
  ): Promise<Result<SessionNameResult[], string>> {
    const { nameContains, timezoneDifference, timeFilter, filter } =
      requestBody;

    if (!isValidTimeZoneDifference(timezoneDifference)) {
      return err("Invalid timezone difference");
    }

    const filters: FilterNode[] = [
      ...(timeFilter ? timeFilterNodes(timeFilter) : []),
      ...(filter ? [filter] : []),
    ];

    if (nameContains) {
      filters.push({
        request_response_rmt: {
          properties: {
            "Helicone-Session-Name": {
              contains: nameContains,
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

    const query = `
    SELECT 
      properties['Helicone-Session-Name'] as name,
      min(request_response_rmt.request_created_at) ${
        timezoneDifference > 0
          ? `- INTERVAL '${Math.abs(timezoneDifference)} minute'`
          : `+ INTERVAL '${timezoneDifference} minute'`
      } AS created_at,
      avg(request_response_rmt.latency) as avg_latency,
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
      and request_created_at > now() - interval '150 days'
    )
    GROUP BY properties['Helicone-Session-Name']
    LIMIT 50
    `;

    const results = await clickhouseDb.dbQuery<SessionNameResult>(
      query,
      builtFilter.argsAcc
    );

    return resultMap(results, (x) =>
      x.map((y) => ({
        ...y,
        avg_latency: +y.avg_latency,
      }))
    );
  }

  private async buildSessionFilters(
    requestBody: SessionQueryParams
  ): Promise<{
    builtFilter: any;
    havingFilter: any;
  }> {
    const {
      search,
      timeFilter,
      filter: filterTree,
      nameEquals,
    } = requestBody;

    const filters: FilterNode[] = [...timeFilterNodes(timeFilter), filterTree];

    if (nameEquals) {
      filters.push({
        request_response_rmt: {
          properties: {
            "Helicone-Session-Name": {
              equals: nameEquals,
            },
          },
        },
      });
    }

    if (search) {
      filters.push(
        filterListToTree(
          [
            {
              request_response_rmt: {
                properties: {
                  "Helicone-Session-Id": {
                    ilike: `%${search}%`,
                  },
                },
              },
            },
            {
              request_response_rmt: {
                properties: {
                  "Helicone-Session-Name": {
                    ilike: `%${search}%`,
                  },
                },
              },
            },
          ],
          "or"
        )
      );
    }

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      filter: filterListToTree(filters, "and"),
      argsAcc: [],
    });

    const havingFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      filter: filterListToTree(filters, "and"),
      argsAcc: [],
      having: true,
    });

    return { builtFilter, havingFilter };
  }

  async getSessions(
    requestBody: SessionQueryParams
  ): Promise<Result<SessionResult[], string>> {
    const {
      timezoneDifference,
      offset = 0,
      limit = 50,
    } = requestBody;

    if (!isValidTimeZoneDifference(timezoneDifference)) {
      return err("Invalid timezone difference");
    }

    const { builtFilter, havingFilter } = await this.buildSessionFilters(requestBody);

    // Step 1 get all the properties given this filter
    const query = `
    SELECT 
      min(request_response_rmt.request_created_at) + INTERVAL ${timezoneDifference} MINUTE AS created_at,
      max(request_response_rmt.request_created_at) + INTERVAL ${timezoneDifference} MINUTE AS latest_request_created_at,
      properties['Helicone-Session-Id'] as session_id,
      properties['Helicone-Session-Name'] as session_name,
      avg(request_response_rmt.latency) as avg_latency,
      sum(request_response_rmt.cost) / ${COST_PRECISION_MULTIPLIER} AS total_cost,
      count(*) AS total_requests,
      sum(request_response_rmt.prompt_tokens) AS prompt_tokens,
      sum(request_response_rmt.completion_tokens) AS completion_tokens,
      sum(request_response_rmt.prompt_tokens) + sum(request_response_rmt.completion_tokens) AS total_tokens
    FROM request_response_rmt
    WHERE (
        has(properties, 'Helicone-Session-Id')
        AND (
          ${builtFilter.filter}
        )
    )
    GROUP BY properties['Helicone-Session-Id'], properties['Helicone-Session-Name']
    HAVING (${havingFilter.filter})
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
    `;

    const results = await clickhouseDb.dbQuery<SessionResult>(
      query,
      builtFilter.argsAcc
    );

    const mappedResults = resultMap(results, (x) =>
      x.map((y) => ({
        ...y,
        completion_tokens: +y.completion_tokens,
        prompt_tokens: +y.prompt_tokens,
        total_tokens: +y.total_tokens,
        avg_latency: +y.avg_latency,
      }))
    );

    if (!mappedResults.data) {
      return err(mappedResults.error);
    }

    return ok(mappedResults.data);
  }

  async getSessionsCount(
    requestBody: SessionQueryParams
  ): Promise<Result<number, string>> {
    const { timezoneDifference } = requestBody;

    if (!isValidTimeZoneDifference(timezoneDifference)) {
      return err("Invalid timezone difference");
    }

    const { builtFilter, havingFilter } = await this.buildSessionFilters(requestBody);

    const countQuery = `
    SELECT count(DISTINCT (properties['Helicone-Session-Id'], properties['Helicone-Session-Name'])) as count 
    FROM request_response_rmt
    WHERE (
        has(properties, 'Helicone-Session-Id')
        AND (
          ${builtFilter.filter}
        )
    )
    HAVING (${havingFilter.filter})
    `;

    const countResult = await clickhouseDb.dbQuery<{ count: number }>(
      countQuery,
      builtFilter.argsAcc
    );

    if (!countResult.data) {
      return err(countResult.error ?? "Error getting sessions count");
    }

    return ok(+countResult.data[0].count);
  }

  async updateSessionFeedback(
    sessionId: string,
    rating: boolean
  ): Promise<Result<null, string>> {
    try {
      const result = await dbExecute<{ id: string }>(
        `SELECT id
         FROM request
         WHERE properties->>'Helicone-Session-Id' = $1
         AND helicone_org_id = $2
         ORDER BY created_at ASC
         LIMIT 1`,
        [sessionId, this.authParams.organizationId]
      );

      if (result.error || !result.data || result.data.length === 0) {
        return err(result.error ?? "No request found");
      }

      const requestManager = new RequestManager(this.authParams);
      const res = await requestManager.addPropertyToRequest(
        result.data[0].id,
        "Helicone-Session-Feedback",
        rating ? "1" : "0"
      );

      if (res.error) {
        return err(res.error);
      }
      return ok(null);
    } catch (error) {
      console.error("Error updating session feedback:", error);
      return err(String(error));
    }
  }

  async getSessionTag(
    sessionId: string
  ): Promise<Result<string | null, string>> {
    try {
      const query = `
        SELECT tag 
        FROM tags 
        WHERE entity_id = {val_0: String} AND entity_type = {val_1: String} AND organization_id = {val_2: String}
        GROUP BY tag 
        ORDER BY max(created_at) DESC
      `;

      const result = await clickhouseDb.dbQuery<{ tag: string }>(query, [
        sessionId,
        TagType.SESSION,
        this.authParams.organizationId,
      ]);

      if (result.error) {
        return err(result.error ?? "No tag found");
      }

      if (!result.data || result.data.length === 0) {
        return ok(null);
      }

      return ok(result.data[0].tag);
    } catch (error) {
      console.error("Error getting session tag:", error);
      return err(String(error));
    }
  }

  async updateSessionTag(
    sessionId: string,
    tag: string
  ): Promise<Result<null, string>> {
    try {
      const valuesToInsert: Tags = {
        organization_id: this.authParams.organizationId,
        entity_type: TagType.SESSION,
        entity_id: sessionId,
        tag: tag,
      };

      const insertResult = await clickhouseDb.dbInsertClickhouse("tags", [
        valuesToInsert,
      ]);

      if (insertResult.error) {
        return err(insertResult.error ?? "Could not update session tag");
      }

      return ok(null); // Successfully inserted
    } catch (error) {
      console.error("Error updating session tag:", error);
      return err(String(error));
    }
  }
}

const timeFilterNodes = (timeFilter: TimeFilterMs): FilterNode[] => {
  if (!timeFilter) {
    return [];
  }
  return [
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
};
