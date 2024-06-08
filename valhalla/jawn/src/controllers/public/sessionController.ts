import { Route, Tags, Security, Controller, Body, Post, Request } from "tsoa";
import { Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface SessionQueryParams {
  sessionIds?: string[];
  timeFilter?: {
    startTimeUnixSeconds: number;
    endTimeUnixSeconds: number;
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
  ): Promise<Result<SessionsResult[], string>> {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.getSessions(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Post("{sessionId}/query")
  public async getSession(
    @Body()
    requestBody: SessionQueryParams,
    @Request() request: JawnAuthenticatedRequest,
    @Path() sessionId: string
  ): Promise<Result<SessionResult, string>> {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.getSession(requestBody, sessionId);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Delete("{sessionId}")
  public async deleteSession(
    @Request() request: JawnAuthenticatedRequest,
    @Path() sessionId: string
  ): Promise<void> {
    const sessionManager = new SessionManager(request.authParams);

    const result = await sessionManager.deleteSession({
      sessionId,
    });

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
  }
}
