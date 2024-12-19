import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { Result, err, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";

import { supabaseServer } from "../../lib/db/supabase";

@Route("/v1/pi")
@Tags("PI")
@Security("api_key")
export class PiController extends Controller {
  @Post("/session")
  public async addSession(
    @Body()
    { sessionUUID }: { sessionUUID: string },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    // clean sessions should probably be done in a cron job

    let one_hour_ago = new Date(new Date().getTime() - 1 * 60 * 60 * 1000);
    // delete all sessions older than 1 hour

    // 10% chance of deleting all sessions older than 1 hour
    if (Math.random() < 0.1) {
      await supabaseServer.client
        .from("pi_session")
        .delete()
        .lt("created_at", one_hour_ago);
    }

    const result = await supabaseServer.client.from("pi_session").insert({
      session_id: sessionUUID,
      organization_id: request.authParams.organizationId,
    });

    if (result.error) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error?.message || "Failed to fetch evals");
    } else {
      this.setStatus(200);
      return ok("success");
    }
  }
}
