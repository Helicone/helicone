import { SessionQueryParams } from "../controllers/public/sessionController";
import { clickhouseDb } from "../lib/db/ClickhouseWrapper";
import { AuthParams, supabaseServer } from "../lib/db/supabase";
import { dbExecute } from "../lib/shared/db/dbExecute";
import {
  buildFilterClickHouse,
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
} from "../lib/shared/filters/filters";
import { Result, resultMap } from "../lib/shared/result";
import { buildRequestSort } from "../lib/shared/sorts/requests/sorts";
import { clickhousePriceCalc } from "../packages/cost";

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

export class SessionManager {
  constructor(private authParams: AuthParams) {}

  async getSessions(
    requestBody: SessionQueryParams
  ): Promise<Result<SessionResult[], string>> {
    const { sessionIdContains, timeFilter } = requestBody;

    const supabaseClient = supabaseServer.client;

    const builtFilter = await buildFilterWithAuthClickHouse({
      org_id: this.authParams.organizationId,
      filter: "all",
      argsAcc: [`%${sessionIdContains}%`],
    });

    // Step 1 get all the properties given this filter
    const query = `
    SELECT 
      min(request_response_versioned.request_created_at) AS created_at,
      max(request_response_versioned.request_created_at) AS latest_request_created_at,
      properties['Helicone-Session-Id'] as session,
      ${clickhousePriceCalc("request_response_versioned")} AS total_cost,
      count(*) AS total_requests,
      sum(request_response_versioned.prompt_tokens) AS prompt_tokens,
      sum(request_response_versioned.completion_tokens) AS completion_tokens
    FROM request_response_versioned
    WHERE (
        has(properties, 'Helicone-Session-Id')
        AND properties['Helicone-Session-Id'] ILIKE {val_0: String}
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
        total_tokens: y.completion_tokens + y.prompt_tokens,
      }))
    );
  }
}
