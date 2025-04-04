import { Controller, Get, Request, Route, Security, Tags } from "tsoa";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { JawnAuthenticatedRequest } from "../../types/request";
import { Database } from "../../lib/db/database.types";

@Route("v1/alert-banner")
@Tags("Alert Banner")
@Security("api_key")
export class AlertBannerController extends Controller {
  @Get("/")
  public async getAlertBanners(@Request() request: JawnAuthenticatedRequest) {
    return await dbExecute<
      Database["public"]["Tables"]["alert_banners"]["Row"]
    >(
      "SELECT * FROM alert_banners WHERE org_id = $1 ORDER BY created_at DESC",
      [request.authParams.organizationId]
    );
  }
}
