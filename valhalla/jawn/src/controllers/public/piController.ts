import {
  Body,
  Controller,
  Example,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result, err, ok } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";

import { buildFilterWithAuthClickHouse } from "@helicone-package/filters/filters";
import { timeFilterToFilterNode } from "@helicone-package/filters/helpers";
import { dbExecute, dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import {
  type DataOverTimeRequest,
  getXOverTime,
} from "../../managers/helpers/getXOverTime";
import { COST_PRECISION_MULTIPLIER } from "@helicone-package/cost/costCalc";
import { authorizeOrgActor, ORG_ADMIN_ROLES } from "../../utils/orgAuthz";
import {
  deleteExpiredPiSessions,
  linkPiSession,
} from "../../lib/stores/piSessionStore";

@Route("/v1/pi")
@Tags("PI")
@Security("api_key")
export class PiController extends Controller {
  /**
   * Links a device session (created by POST /v1/public/pi/session) to the
   * signed-in organization. Requires a signed-in owner or admin; only
   * server-issued, unexpired, not-yet-linked session ids are accepted.
   */
  @Post("/session")
  public async addSession(
    @Body()
    body: { sessionUUID: string },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const actor = await authorizeOrgActor(request.authParams, ORG_ADMIN_ROLES);
    if (actor.error !== null) {
      this.setStatus(actor.error.status);
      return err(actor.error.message);
    }

    // clean sessions should probably be done in a cron job
    if (Math.random() < 0.1) {
      await deleteExpiredPiSessions();
    }

    const linked = await linkPiSession({
      sessionId: body.sessionUUID,
      organizationId: actor.data.organizationId,
      userId: actor.data.userId,
    });

    if (linked.error !== null) {
      this.setStatus(400);
      return err(linked.error);
    }
    this.setStatus(200);
    return ok("success");
  }

  @Post("/org-name/query")
  public async getOrgName(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const result = await dbExecute<{
      name: string;
    }>(
      `SELECT name FROM organization
       WHERE id = $1`,
      [request.authParams.organizationId]
    );

    if (result.error || !result.data || result.data.length === 0) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error || "Failed to fetch organization");
    }

    return ok(result.data[0]?.name || "Unknown");
  }

  @Post("/total-costs")
  public async getTotalCosts(
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

    const result = await dbQueryClickhouse<{
      cost: number;
    }>(query, argsAcc);

    return ok(result.data?.[0]?.cost || 0);
  }

  @Post("/total_requests")
  public async piGetTotalRequests(
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

  @Post("/costs-over-time/query")
  @Example<DataOverTimeRequest>({
    userFilter: "all",
    timeFilter: {
      start: "2024-01-01",
      end: "2024-01-31",
    },
    dbIncrement: "day",
    timeZoneDifference: 0,
  })
  public async getCostsOverTime(
    @Body()
    requestBody: DataOverTimeRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      {
        cost: number;
        created_at_trunc: string;
      }[],
      string
    >
  > {
    return await getXOverTime<{
      cost: number;
    }>(requestBody, {
      orgId: request.authParams.organizationId,
      countColumns: [`sum(request_response_rmt.cost) / ${COST_PRECISION_MULTIPLIER} as cost`],
      groupByColumns: ["created_at_trunc"],
    });
  }
}
