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
