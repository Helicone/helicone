import { SessionQueryParams } from "../controllers/public/sessionController";
import { AuthParams, supabaseServer } from "../lib/db/supabase";
import { dbExecute } from "../lib/shared/db/dbExecute";
import { buildFilterWithAuth } from "../lib/shared/filters/filters";
import { Result, resultMap } from "../lib/shared/result";
import { buildRequestSort } from "../lib/shared/sorts/requests/sorts";

export class SessionManager {
  constructor(private authParams: AuthParams) {}

  async getSessions(
    requestBody: SessionQueryParams
  ): Promise<Result<any, string>> {
    const {
      filter,
      offset = 0,
      limit = 10,
      sort = {
        created_at: "desc",
      },
      isCached,
      isPartOfExperiment,
      isScored,
    } = requestBody;

    let newFilter = filter;

    // if (isScored !== undefined) {
    //   newFilter = this.addScoreFilter(isScored, newFilter);
    // }

    // if (isPartOfExperiment !== undefined) {
    //   newFilter = this.addPartOfExperimentFilter(isPartOfExperiment, newFilter);
    // }

    const supabaseClient = supabaseServer.client;

    const builtFilter = await buildFilterWithAuth({
      org_id: this.authParams.organizationId,
      filter,
      argsAcc: [],
    });

    const sortSQL = buildRequestSort(sort);

    const query = `
    WITH filtered_requests AS (
      SELECT
        request.created_at as created_at,
        properties->>'Helicone-Session-Id' as session_id
      FROM request
      LEFT JOIN response ON request.id = response.request
      WHERE (${builtFilter.filter}
        AND request.properties->>'Helicone-Session-Id' IS NOT NULL)
    ),
    grouped_sessions AS (
      SELECT
        session_id,
        MAX(created_at) as created_at
      FROM filtered_requests
      GROUP BY session_id
    )
    SELECT
      session_id
    FROM grouped_sessions
    ${sortSQL !== undefined ? `ORDER BY created_at` : ""}
    LIMIT ${limit}
    OFFSET ${offset}
    `;

    const results = await dbExecute<{
      session_id: string;
    }>(query, builtFilter.argsAcc);

    console.log(`Results: ${JSON.stringify(results)}`);

    return resultMap(results, (result: any) => ({
      session_id: result.session_id,
    }));
  }
}
