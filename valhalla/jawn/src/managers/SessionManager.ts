import {
  SessionNameQueryParams,
  SessionQueryParams,
} from "../controllers/public/sessionController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams } from "../lib/db/supabase";
import { filterListToTree, FilterNode } from "../lib/shared/filters/filterDefs";
import { buildFilterWithAuthClickHouse } from "../lib/shared/filters/filters";
import { err, Result, resultMap } from "../lib/shared/result";
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

export class SessionManager {
  constructor(private authParams: AuthParams) {}

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
