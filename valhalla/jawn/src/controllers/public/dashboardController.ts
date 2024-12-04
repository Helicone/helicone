// src/users/usersController.ts
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
import { Result } from "../../lib/shared/result";
import {
  DataOverTimeRequest,
  getXOverTime,
} from "../../managers/helpers/getXOverTime";
import { JawnAuthenticatedRequest } from "../../types/request";

@Route("v1/dashboard")
@Tags("Dashboard")
@Security("api_key")
export class DashboardController extends Controller {
  @Post("/scores/query")
  @Example<DataOverTimeRequest>({
    userFilter: "all",
    timeFilter: {
      start: "2024-01-01",
      end: "2024-01-31",
    },
    dbIncrement: "day",
    timeZoneDifference: 0,
  })
  public async getScoresOverTime(
    @Body()
    requestBody: DataOverTimeRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      {
        score_key: string;
        score_sum: number;
        created_at_trunc: string;
      }[],
      string
    >
  > {
    return await getXOverTime<{
      score_key: string;
      score_sum: number;
    }>(requestBody, {
      orgId: request.authParams.organizationId,
      countColumn:
        "avg(mapValues(scores)[indexOf(mapKeys(scores), score_key)]) AS score_sum",
      groupByColumns: ["arrayJoin(mapKeys(scores)) AS score_key"],
    });
  }
}
