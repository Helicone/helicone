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
import { Message } from "../../lib/handlers/HandlerContext";
import { LogManager } from "../../managers/LogManager";
import { AlertRequest } from "../../lib/stores/AlertStore";
import { AlertManager } from "../../managers/alert/AlertManager";

@Route("v1/alert")
@Tags("Alert")
@Security("api_key")
export class AlertController extends Controller {
  @Get("/query")
  public async getAlerts(@Request() request: JawnAuthenticatedRequest) {
    const manager = new AlertManager(request.authParams);
    return manager.getAlerts();
  }

  @Post("/create")
  public async createAlert(
    @Body()
    alert: AlertRequest,
    @Request() request: JawnAuthenticatedRequest
  ) {
    const manager = new AlertManager(request.authParams);
    return manager.createAlert(alert);
  }

  @Delete("/{alertId}")
  public async deleteAlert(
    @Path() alertId: string,
    @Request() request: JawnAuthenticatedRequest
  ) {
    const manager = new AlertManager(request.authParams);
    return manager.deleteAlert(alertId);
  }
}
