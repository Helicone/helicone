import { Controller, Get, Request, Route, Security, Tags } from "tsoa";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { JawnAuthenticatedRequest } from "../../types/request";

@Route("v1/alert-banner")
@Tags("Alert Banner")
@Security("api_key")
export class AlertBannerController extends Controller {
  @Get("/")
  public async getAlertBanners(@Request() request: JawnAuthenticatedRequest) {
    return await dbExecute<{
      active: boolean;
      created_at: string;
      id: number;
      message: string | null;
      title: string | null;
      updated_at: string;
    }>(
      "SELECT id, title, message, active, created_at, updated_at FROM alert_banner WHERE org_id = $1 ORDER BY created_at DESC",
      [request.authParams.organizationId]
    );
  }
}
