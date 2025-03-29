import {
  Route,
  Tags,
  Security,
  Controller,
  Body,
  Post,
  Request,
  Path,
  Get,
} from "tsoa";
import { err, ok, Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  SessionManager,
  SessionNameResult,
  SessionResult,
} from "../../managers/SessionManager";
import { KVCache } from "../../lib/cache/kvCache";
import { cacheResultCustom } from "../../utils/cacheResult";
import { result } from "lodash";
import { FilterLeafSubset } from "../../lib/shared/filters/filterDefs";

export type SessionFilterBranch = {
  left: SessionFilterNode;
  operator: "or" | "and";
  right: SessionFilterNode;
};

export type SessionFilterNode =
  | FilterLeafSubset<"request_response_rmt" | "sessions_request_response_rmt">
  | SessionFilterBranch
  | "all";

export interface SessionQueryParams {
  search: string;
  timeFilter: {
    startTimeUnixMs: number;
    endTimeUnixMs: number;
  };
  nameEquals?: string;
  timezoneDifference: number;
  filter: SessionFilterNode;
}

export interface SessionNameQueryParams {
  nameContains: string;
  timezoneDifference: number;
  pSize?: "p50" | "p75" | "p95" | "p99" | "p99.9";
  useInterquartile?: boolean;
}

const kvCache = new KVCache(60 * 1000); // 5 minutes

@Route("v1/session")
@Tags("Session")
@Security("api_key")
export class SessionController extends Controller {
  @Get("/has-session")
  public async hasSession(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<boolean, string>> {
    const found = await cacheResultCustom<boolean, string>(
      `has-session-${request.authParams.organizationId}`,
      async () => {
        const sessionManager = new SessionManager(request.authParams);
        const result = await sessionManager.getSessions({
          filter: "all",
          search: "",
          timeFilter: {
            startTimeUnixMs: new Date().getTime() - 1000 * 60 * 60 * 30,
            endTimeUnixMs: new Date().getTime(),
          },
          timezoneDifference: 0,
        });
        if (result.error || !result.data) {
          return err("Error finding sessions");
        } else {
          if (result.data.length > 0) {
            return ok(true);
          } else {
            return err("No sessions found");
          }
        }
      },
      kvCache
    );
    if (found.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return found;
  }

  @Post("query")
  public async getSessions(
    @Body()
    requestBody: SessionQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<SessionResult[], string>> {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.getSessions(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("name/query")
  public async getNames(
    @Body()
    requestBody: SessionNameQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<SessionNameResult[], string>> {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.getSessionNames(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("metrics/query")
  public async getMetrics(
    @Body()
    requestBody: SessionNameQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ) {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.getMetrics(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("/{sessionId}/feedback")
  public async updateSessionFeedback(
    @Path() sessionId: string,
    @Body() requestBody: { rating: boolean },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.updateSessionFeedback(
      sessionId,
      requestBody.rating
    );
    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }
}
