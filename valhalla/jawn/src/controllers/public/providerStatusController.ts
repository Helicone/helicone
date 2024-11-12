import {
  Controller,
  Route,
  Security,
  Tags,
  Request,
  Get,
  Path,
  Body,
  Query,
} from "tsoa";
import { Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  ProviderMetrics,
  ProviderStatusManager,
} from "../../managers/ProviderStatusManager";

export type TimeFrame = "24h" | "7d" | "30d";

@Route("v1/public/status/provider")
@Tags("Status")
@Security("api_key")
export class StatusController extends Controller {
  @Get("")
  public async getAllProviderStatus(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ProviderMetrics[], string>> {
    const providerStatusManager = new ProviderStatusManager();
    const result = await providerStatusManager.getAllProviderStatus();

    return result;
  }

  @Get("/{provider}")
  public async getProviderStatus(
    @Request() request: JawnAuthenticatedRequest,
    @Path() provider: string,
    @Query() timeFrame: TimeFrame
  ): Promise<Result<ProviderMetrics, string>> {
    const providerStatusManager = new ProviderStatusManager();
    const result = await providerStatusManager.getProviderStatus(
      provider,
      timeFrame
    );

    return result;
  }

  // @Get("/{provider}/latency")
  // public async getProviderLatency(
  //   @Request() request: JawnAuthenticatedRequest,
  //   @Path() provider: string,
  //   @Body()
  //   body: {
  //     timeFilter: "24h" | "7d" | "30d";
  //   }
  // ): Promise<Result<ProviderMetrics, string>> {
  //   const providerStatusManager = new ProviderStatusManager();
  //   const result = await providerStatusManager.getLatency(provider);
  // }
}
