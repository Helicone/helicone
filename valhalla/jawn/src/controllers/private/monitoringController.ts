import {
  Body,
  Controller,
  Delete,
  Example,
  Get,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import { MonitoringManager } from "../../managers/monitoring/monitoringManager";

export type ChartView = "time" | "distribution" | "pie";

export interface ChartSelection {
  evaluatorId: string;
  onlineEvaluatorId: string;
  chartTypes: ChartView[];
}

export interface MonitoringDashboard {
  config: ChartSelection[];
}

@Route("v1/monitoring")
@Tags("Monitoring")
@Security("api_key")
export class MonitoringController extends Controller {
  @Put("/dashboard")
  @Example<MonitoringDashboard>({
    config: [
      {
        evaluatorId: "1",
        onlineEvaluatorId: "1",
        chartTypes: ["time", "distribution", "pie"],
      },
    ],
  })
  public async upsertMonitoringDashboard(
    @Body()
    requestBody: MonitoringDashboard,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const monitoringManager = new MonitoringManager(request.authParams);
    return await monitoringManager.upsertMonitoringDashboard(requestBody.config);
  }

  @Get("/dashboard")
  public async getMonitoringDashboard(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ChartSelection[], string>> {
    const monitoringManager = new MonitoringManager(request.authParams);
    return await monitoringManager.getMonitoringDashboard();
  }

  @Delete("/dashboard")
  public async deleteMonitoringDashboard(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const monitoringManager = new MonitoringManager(request.authParams);
    return await monitoringManager.deleteMonitoringDashboard();
  }
}
