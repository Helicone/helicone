import { Controller, Route, Security, Tags, Request, Get, Path } from "tsoa";
import { Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  ProviderMetrics,
  ProviderStatusManager,
} from "../../managers/ProviderStatusManager";

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
    @Path() provider: string
  ): Promise<Result<ProviderMetrics, string>> {
    const providerStatusManager = new ProviderStatusManager();
    const result = await providerStatusManager.getProviderStatus(provider);

    return result;
  }
}
