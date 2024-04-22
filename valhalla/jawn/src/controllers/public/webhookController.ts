import { Route, Tags, Security, Controller, Post, Body, Request } from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import { err, ok, Result } from "../../lib/shared/result";
import { ScoreManager } from "../../managers/score/ScoreManager";

export interface ScoreRequest {
  request_id: string;
  organization_id: string;
  scores: Record<string, number>;
}

@Route("v1/webhook")
@Tags("Webhook")
@Security("api_key")
export class WebhookControler extends Controller {
  @Post("/score")
  public async addScores(
    @Body()
    requestBody: ScoreRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const scoreManager = new ScoreManager(request.authParams);

    const result = await scoreManager.addScores(
      requestBody.request_id,
      requestBody.organization_id,
      requestBody.scores
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err("Not implemented");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }
}
