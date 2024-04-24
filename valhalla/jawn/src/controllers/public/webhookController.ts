import {
  Route,
  Tags,
  Security,
  Controller,
  Post,
  Body,
  Request,
  Path,
} from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import { err, ok, Result } from "../../lib/shared/result";
import { ScoreManager } from "../../managers/score/ScoreManager";
import { hashAuth } from "../../lib/db/hash";

export interface ScoreRequest {
  scores: Record<string, number>;
}

@Route("v1/webhook")
@Tags("Webhook")
@Security("api_key")
export class WebhookControler extends Controller {
  @Post("/request/{requestId}/score")
  public async addScores(
    @Body()
    requestBody: ScoreRequest,
    @Request() request: JawnAuthenticatedRequest,
    @Path() requestId: string
  ): Promise<Result<null, string>> {
    const scoreManager = new ScoreManager(request.authParams);

    const result = await scoreManager.addScores(requestId, requestBody.scores);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err("Not implemented");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }
}
