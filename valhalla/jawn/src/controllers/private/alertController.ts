import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { AlertManager, AlertResponse } from "../../managers/alert/AlertManager";
import type { AlertRequest } from "../../managers/alert/AlertManager";
import { Result, err } from "../../packages/common/result";
import { checkJwtOrgAdmin } from "../../utils/orgAuthz";

@Route("v1/alert")
@Tags("Alert")
@Security("api_key")
export class AlertController extends Controller {
  @Get("/query")
  public async getAlerts(
    @Request() request: JawnAuthenticatedRequest,
    @Query() historyPage?: number,
    @Query() historyPageSize?: number
  ): Promise<Result<AlertResponse, string>> {
    const manager = new AlertManager(request.authParams);
    const result = await manager.getAlerts({
      historyPage: historyPage ?? 0,
      historyPageSize: historyPageSize ?? 25,
    });
    return result;
  }

  @Post("/create")
  public async createAlert(
    @Body()
    alert: AlertRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const denied = await checkJwtOrgAdmin(request.authParams);
    if (denied) {
      this.setStatus(denied.status);
      return err(denied.message);
    }
    const manager = new AlertManager(request.authParams);
    const result = await manager.createAlert(alert);
    return result;
  }

  @Delete("/{alertId}")
  public async deleteAlert(
    @Path() alertId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const denied = await checkJwtOrgAdmin(request.authParams);
    if (denied) {
      this.setStatus(denied.status);
      return err(denied.message);
    }
    const manager = new AlertManager(request.authParams);
    const result = await manager.deleteAlert(alertId);
    return result;
  }
}
