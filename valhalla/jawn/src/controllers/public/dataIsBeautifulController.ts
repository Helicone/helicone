import { Body, Controller, Post, Route, Security, Tags, Request } from "tsoa";
import { Result, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import { DataIsBeautifulManager } from "../../managers/DataIsBeautifulManager";
import {
  ProviderName,
  ModelNames,
} from "../../packages/cost/providers/mappings";

export type TimeSpan = "1m" | "3m" | "6m" | "all";
export type DataIsBeautifulRequestBody = {
  timespan: TimeSpan;
  model?: ModelNames;
  provider?: ProviderName;
};

export type ModelBreakdown = {
  model: string;
  percent: number;
};

@Route("v1/public/dataisbeautiful")
@Tags("DataIsBeautiful")
@Security("api_key")
export class DataIsBeautifulRouter extends Controller {
  @Post("/")
  public async createNewExperiment(
    @Body()
    requestBody: DataIsBeautifulRequestBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ModelBreakdown[], string>> {
    const dataIsBeautifulManager = new DataIsBeautifulManager();

    const result = await dataIsBeautifulManager.getModelBreakdown(requestBody);

    if (result.error) {
      this.setStatus(500);
    }

    this.setStatus(200);
    return ok(result.data ?? []);
  }
}
