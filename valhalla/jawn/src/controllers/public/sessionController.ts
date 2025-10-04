import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { KVCache } from "../../lib/cache/kvCache";
import { FilterLeafSubset } from "@helicone-package/filters/filterDefs";
import {
  SessionManager,
  SessionMetrics,
  SessionNameResult,
  SessionResult,
  SessionsAggregateMetrics,
} from "../../managers/SessionManager";
import { err, ok, Result } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { cacheResultCustom } from "../../utils/cacheResult";
import { TimeFilterMs } from "@helicone-package/filters/filterDefs";

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
  offset?: number;
  limit?: number;
}

export interface SessionNameQueryParams {
  nameContains: string;
  timezoneDifference: number;
  pSize?: "p50" | "p75" | "p95" | "p99" | "p99.9";
  useInterquartile?: boolean;
  timeFilter?: TimeFilterMs; // TODO: after deploy backend and frontend it should always be present
  filter?: SessionFilterNode; // TODO: after deploy backend and frontend it should always be present
}

export interface SessionMetricsQueryParams {
  nameContains: string;
  timezoneDifference: number;
  pSize?: "p50" | "p75" | "p95" | "p99" | "p99.9";
  useInterquartile?: boolean;
  timeFilter?: TimeFilterMs; // TODO: after deploy backend and frontend it should always be present
  filter?: SessionFilterNode; // TODO: after deploy backend and frontend it should always be present
}

const kvCache = new KVCache(60 * 1000); // 5 minutes

@Route("v1/session")
@Tags("Session")
@Security("api_key")
export class SessionController extends Controller {
  @Get("/has-session")
  public async hasSession(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<boolean, string>> {
    const found = await cacheResultCustom<boolean, string>(
      `has-session-${request.authParams.organizationId}`,
      async () => {
        const sessionManager = new SessionManager(request.authParams);
        const result = await sessionManager.getSessionsCount({
          filter: {},
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
          if (result.data?.count > 0) {
            return ok(true);
          } else {
            return err("No sessions found");
          }
        }
      },
      kvCache,
    );
    if (found.error) {
      console.error("Error finding sessions", found.error);
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
    @Request() request: JawnAuthenticatedRequest,
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

  @Post("count")
  public async getSessionsCount(
    @Body()
    requestBody: SessionQueryParams,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<SessionsAggregateMetrics, string>> {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.getSessionsCount(requestBody);
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
    @Request() request: JawnAuthenticatedRequest,
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
    requestBody: SessionMetricsQueryParams,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<SessionMetrics, string>> {
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
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.updateSessionFeedback(
      sessionId,
      requestBody.rating,
    );
    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Get("/{sessionId}/tag")
  public async getSessionTag(
    @Path() sessionId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<string | null, string>> {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.getSessionTag(sessionId);
    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("/{sessionId}/tag")
  public async updateSessionTag(
    @Path() sessionId: string,
    @Body() requestBody: { tag: string },
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.updateSessionTag(
      sessionId,
      requestBody.tag,
    );
    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }
}
