import { Route, Tags, Security, Controller, Body, Post, Request } from "tsoa";
import {
  GeneratedChart,
  GenUiManager,
} from "../../managers/genUi/genUiManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { Result } from "../../lib/shared/result";
import { RequestManager } from "../../managers/request/RequestManager";

export interface NewChartParams {
  prompt: string;
}

@Route("v1/genUi")
@Tags("GenUi")
@Security("api_key")
export class GenUiController extends Controller {
  @Post("/chart")
  public async genearteChart(
    @Body()
    requestBody: NewChartParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<GeneratedChart, string>> {
    const genUiManager = new GenUiManager(request.authParams);

    return genUiManager.genearteChart(requestBody.prompt);
  }
}
