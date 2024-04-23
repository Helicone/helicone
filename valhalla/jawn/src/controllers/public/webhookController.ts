import { Route, Tags, Security, Controller, Post, Body, Request } from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import { err, ok, Result } from "../../lib/shared/result";
import { ScoreManager } from "../../managers/score/ScoreManager";
import { hashAuth } from "../../lib/db/hash";

export interface ScoreRequest {
  request_id: string;
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
    const heliconeAuth = request.headers.authorization;
    if (!heliconeAuth) {
      return err("No Helicone-Auth header provided");
    }
    const heliconeApiKey = await hashAuth(heliconeAuth.replace("Bearer ", ""));
    const scoreManager = new ScoreManager(request.authParams);

    const result = await scoreManager.addScores(
      requestBody.request_id,
      heliconeApiKey,
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
