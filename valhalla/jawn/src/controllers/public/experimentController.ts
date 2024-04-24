// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { Result, err } from "../../lib/shared/result";
import { ExperimentManager } from "../../managers/experiment/ExperimentManager";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface NewExperimentParams {
  datasetId: string;
  promptVersion: string;
  model: string;
}

@Route("v1/experiment")
@Tags("Experiment")
@Security("api_key")
export class ExperimentController extends Controller {
  @Post("/")
  public async createNewExperiment(
    @Body()
    requestBody: NewExperimentParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      {
        experimentId: string;
      },
      string
    >
  > {
    const datasetManager = new ExperimentManager(request.authParams);

    const result = await datasetManager.addNewExperiment(requestBody);
    // const result = await promptManager.getPrompts(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
      console.error(result.error);
      return err("Not implemented");
    } else {
      this.setStatus(200); // set return status 201
      return result;
    }
  }
}
