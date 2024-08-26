import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  AlertManager,
  AlertRequest,
  AlertResponse,
} from "../../managers/alert/AlertManager";
import { Result } from "../../lib/shared/result";

@Route("v1/alert")
@Tags("Alert")
@Security("api_key")
export class AlertController extends Controller {
  @Get("/query")
  public async getAlerts(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<AlertResponse, string>> {
    const manager = new AlertManager(request.authParams);
    const result = await manager.getAlerts();
    return result;
  }

  @Post("/create")
  public async createAlert(
    @Body()
    alert: AlertRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const manager = new AlertManager(request.authParams);
    const result = await manager.createAlert(alert);
    return result;
  }

  @Delete("/{alertId}")
  public async deleteAlert(
    @Path() alertId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const manager = new AlertManager(request.authParams);
    const result = await manager.deleteAlert(alertId);
    return result;
  }
}
