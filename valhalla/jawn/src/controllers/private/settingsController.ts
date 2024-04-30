// src/users/usersController.ts
import { Controller, Get, Request, Route, Security, Tags } from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";

@Route("v1/settings")
@Tags("Settings")
@Security("api_key")
export class SettingController extends Controller {
  @Get("/query")
  public async getSettings(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<{
    useAzureForExperiment: boolean;
  }> {
    return {
      useAzureForExperiment: !!process.env.AZURE_BASE_URL,
    };
  }
}
