// src/users/usersController.ts
import {
  Body,
  Controller,
  Example,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result, err, ok } from "../../lib/shared/result";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { SortLeafRequest } from "../../lib/shared/sorts/requests/sorts";
import { HeliconeRequest } from "../../lib/stores/request/request";
import { RequestManager } from "../../managers/request/RequestManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { PromptManager } from "../../managers/prompt/PromptManager";
import { DatasetManager } from "../../managers/dataset/DatasetManager";
import { ExperimentManager } from "../../managers/experiment/ExperimentManager";

export interface NewExperimentParams {
  datasetId: string;
  promptVersion: string;
  model: string;
}

export interface ExperimentRun {}

export interface Experiment {
  id: string;
  dataset: {
    id: string;
    name: string;
    rows: {
      rowId: string;
      requestId: string;
    }[];
  };
  createdAt: string;
  hypotheses: {
    id: string;
    promptVersionId: string;
    model: string;
    status: string;
    createdAt: string;
    runs: {
      datasetRowId: string;
      resultRequestId: string;
    }[];
  }[];
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
    const experimentManager = new ExperimentManager(request.authParams);

    const result = await experimentManager.addNewExperiment(requestBody);
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

  @Post("/query")
  public async getExperiments(
    @Body()
    requestBody: {},
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Experiment[], string>> {
    const experimentManager = new ExperimentManager(request.authParams);

    const result = await experimentManager.getExperiments();
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
