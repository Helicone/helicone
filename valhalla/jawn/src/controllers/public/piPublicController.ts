import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { Result, err, ok } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";

import { dbExecute } from "../../lib/shared/db/dbExecute";
import { generateHeliconeAPIKey } from "../../lib/experiment/tempKeys/tempAPIKey";

@Route("/v1/public/pi")
@Tags("PI")
@Security("api_key")
export class PiPublicController extends Controller {
  @Post("/get-api-key")
  public async getApiKey(
    @Body()
    body: {
      sessionUUID: string;
    },
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<{ apiKey: string }, string>> {
    let one_hour_ago = new Date(new Date().getTime() - 1 * 60 * 60 * 1000);

    const sessionResult = await dbExecute<{
      organization_id: string;
    }>(
      `SELECT organization_id FROM pi_session
       WHERE session_id = $1
       AND created_at > $2
       LIMIT 1`,
      [body.sessionUUID, one_hour_ago.toISOString()],
    );

    if (sessionResult.error) {
      console.error(sessionResult.error);
      this.setStatus(500);
      return err(sessionResult.error);
    }

    if (!sessionResult.data || sessionResult.data.length === 0) {
      this.setStatus(404);
      return err("Session not found");
    }

    const apiKey = await generateHeliconeAPIKey(
      sessionResult.data[0].organization_id,
      "Auto Generated PI Key",
      "rw",
    );

    const { error: deleteError } = await dbExecute(
      `DELETE FROM pi_session
       WHERE session_id = $1`,
      [body.sessionUUID],
    );

    if (deleteError) {
      console.error(deleteError);
      this.setStatus(500);
      return err(deleteError);
    }

    if (apiKey.error) {
      this.setStatus(500);
      return err(apiKey.error);
    } else {
      this.setStatus(200);
      return ok({ apiKey: apiKey.data!.apiKey });
    }
  }
}
