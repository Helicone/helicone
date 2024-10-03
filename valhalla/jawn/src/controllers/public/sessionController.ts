import { Route, Tags, Security, Controller, Body, Post, Request } from "tsoa";
import { Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  SessionManager,
  SessionNameResult,
  SessionResult,
} from "../../managers/SessionManager";

export interface SessionQueryParams {
  sessionIdContains: string;
  timeFilter: {
    startTimeUnixMs: number;
    endTimeUnixMs: number;
  };
  sessionName: string;
  timezoneDifference: number;
}

export interface SessionNameQueryParams {
  nameContains: string;
  timezoneDifference: number;
  pSize?: "p50" | "p75" | "p95" | "p99" | "p99.9";
  useInterquartile?: boolean;
}

@Route("v1/session")
@Tags("Session")
@Security("api_key")
export class SessionController extends Controller {
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
}
