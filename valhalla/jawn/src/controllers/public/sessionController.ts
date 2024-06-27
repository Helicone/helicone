import { Route, Tags, Security, Controller, Body, Post, Request } from "tsoa";
import { Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import { SessionManager, SessionResult } from "../../managers/SessionManager";

export interface SessionQueryParams {
  sessionIdContains: string;
  timeFilter: {
    startTimeUnixMs: number;
    endTimeUnixMs: number;
  };
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
}
