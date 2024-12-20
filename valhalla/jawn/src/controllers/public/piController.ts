import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { Result, err, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";

import { supabaseServer } from "../../lib/db/supabase";
import { RequestManager } from "../../managers/request/RequestManager";
import { buildFilterWithAuthClickHouse } from "../../lib/shared/filters/filters";
import { timeFilterToFilterNode } from "../../lib/shared/filters/filterDefs";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";

@Route("/v1/pi")
@Tags("PI")
@Security("api_key")
export class PiController extends Controller {
  @Post("/session")
  public async addSession(
    @Body()
    body: { sessionUUID: string },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    // clean sessions should probably be done in a cron job
    let one_hour_ago = new Date(new Date().getTime() - 1 * 60 * 60 * 1000);
    // delete all sessions older than 1 hour

    // 10% chance of deleting all sessions older than 1 hour
    if (Math.random() < 0.1) {
      await supabaseServer.client
        .from("pi_session")
        .delete()
        .lt("created_at", one_hour_ago);
    }

    const result = await supabaseServer.client.from("pi_session").insert({
      session_id: body.sessionUUID,
      organization_id: request.authParams.organizationId,
    });

    if (result.error) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error?.message || "Failed to fetch evals");
    } else {
      this.setStatus(200);
      return ok("success");
    }
  }

  @Post("/total_requests")
  public async getTotalRequests(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endTime = new Date(Date.now());

    const { filter: filterString, argsAcc } =
      await buildFilterWithAuthClickHouse({
        org_id: request.authParams.organizationId,
        filter: {
          left: timeFilterToFilterNode(
            {
              start: startTime,
              end: endTime,
            },
            "request_response_rmt"
          ),
          right: "all",
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

    const result = await dbQueryClickhouse<{
      count: number;
    }>(query, argsAcc);

    return ok(result.data?.[0]?.count || 0);
  }
}
