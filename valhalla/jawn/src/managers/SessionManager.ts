import {
  SessionNameQueryParams,
  SessionQueryParams,
} from "../controllers/public/sessionController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams, supabaseServer } from "../lib/db/supabase";
import { filterListToTree, FilterNode } from "../lib/shared/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../lib/shared/filters/filters";
import { err, ok, Result, resultMap } from "../lib/shared/result";
import { clickhousePriceCalc } from "../packages/cost";
import { isValidTimeZoneDifference } from "../utils/helpers";
import {
  getHistogramRowOnKeys,
  HistogramRow,
} from "./helpers/percentileDistributions";
import { RequestManager } from "./request/RequestManager";

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
}

export interface SessionNameResult {
  name: string;
  created_at: string;
  total_cost: number;
  last_used: string;
  first_used: string;
  session_count: number;
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

    const histogramData = await getHistogramRowOnKeys({
      keys: [
        { key: "properties['Helicone-Session-Name']", alias: "session_name" },
        { key: "properties['Helicone-Session-Id']", alias: "session_id" },
      ],
      pSize: requestBody.pSize ?? "p75",
      useInterquartile: requestBody.useInterquartile ?? false,
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
      aggregateFunction: clickhousePriceCalc("request_response_rmt"),
    });

    if (sessionCostData.error) {
      return sessionCostData;
    }

    return ok({
      session_count: histogramData.data!,
      session_duration: sessionDurationData.data!,
      session_cost: sessionCostData.data!,
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
    LIMIT 50
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
    const {
      search,
      timeFilter,
      timezoneDifference,
      filter: filterTree,
      nameEquals,
    } = requestBody;

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
      filterTree,
    ];

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

    // Step 1 get all the properties given this filter
    const query = `
    SELECT 
      min(request_response_rmt.request_created_at) + INTERVAL ${timezoneDifference} MINUTE AS created_at,
      max(request_response_rmt.request_created_at) + INTERVAL ${timezoneDifference} MINUTE AS latest_request_created_at,
      properties['Helicone-Session-Id'] as session_id,
      properties['Helicone-Session-Name'] as session_name,
      ${clickhousePriceCalc("request_response_rmt")} AS total_cost,
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
        total_tokens: +y.total_tokens,
      }))
    );
  }

  async updateSessionFeedback(
    sessionId: string,
    rating: boolean
  ): Promise<Result<null, string>> {
    const { data, error } = await supabaseServer.client
      .from("request")
      .select("id")
      .eq("properties->Helicone-Session-Id", `"${sessionId}"`)
      .eq("helicone_org_id", this.authParams.organizationId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) {
      return err(error.message);
    }

    if (!data || data.length === 0) {
      return err("No request found");
    }

    const requestManager = new RequestManager(this.authParams);
    const res = await requestManager.addPropertyToRequest(
      data[0].id,
      "Helicone-Session-Feedback",
      rating ? "1" : "0"
    );

    if (res.error) {
      return err(res.error);
    }
    return ok(null);
  }
}
