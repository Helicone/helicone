import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import type { JawnAuthenticatedRequest } from "../../types/request";

@Route("v1/user-feedback")
@Tags("User Feedback")
@Security("api_key")
export class UserFeedbackController extends Controller {
  @Post("/")
  public async postUserFeedback(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      feedback: string;
      tag: string;
    },
  ) {
    const result = await dbExecute(
      `INSERT INTO user_feedback (feedback, organization_id, tag) VALUES ($1, $2, $3)`,
      [body.feedback, request.authParams.organizationId, body.tag],
    );
    if (result.error) {
      this.setStatus(500);
      return {
        error: result.error,
      };
    }
    return {
      success: true,
    };
  }
}
