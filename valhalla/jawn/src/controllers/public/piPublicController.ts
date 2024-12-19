import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { Result, err, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";

import { supabaseServer } from "../../lib/db/supabase";
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
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ apiKey: string }, string>> {
    const session = await supabaseServer.client
      .from("pi_session")
      .select("*")
      .eq("session_id", body.sessionUUID)
      .single();

    if (session.error) {
      console.error(session.error);
      this.setStatus(500);
      return err(session.error.message);
    }

    if (!session.data) {
      this.setStatus(404);
      return err("Session not found");
    }

    const apiKey = await generateHeliconeAPIKey(
      session.data.organization_id,
      "Auto Generated PI Key"
    );

    const deleteKey = await supabaseServer.client
      .from("pi_session")
      .delete()
      .eq("session_id", body.sessionUUID);

    if (deleteKey.error) {
      console.error(deleteKey.error);
      this.setStatus(500);
      return err(deleteKey.error.message);
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
