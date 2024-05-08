// src/users/usersController.ts
import {
  Body,
  Controller,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  FilterLeafSubset,
  FilterNode,
} from "../../lib/shared/filters/filterDefs";
import { Result, err } from "../../lib/shared/result";
import { SortLeafRequest } from "../../lib/shared/sorts/requests/sorts";
import { HeliconeRequest } from "../../lib/stores/request/request";
import { ExperimentManager } from "../../managers/experiment/ExperimentManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  Experiment,
  IncludeExperimentKeys,
} from "../../lib/stores/experimentStore";

export type ExperimentFilterBranch = {
  left: ExperimentFilterNode;
  operator: "or" | "and";
  right: ExperimentFilterNode;
};
type ExperimentFilterNode =
  | FilterLeafSubset<"experiment">
  | ExperimentFilterBranch
  | "all";

export interface NewExperimentParams {
  datasetId: string;
  promptVersion: string;
  model: string;
  providerKeyId: string;
  meta?: any;
}

export interface ExperimentRun {}

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
      return err(result.error);
    } else {
      this.setStatus(200); // set return status 201
      return result;
    }
  }

  @Post("/query")
  public async getExperiments(
    @Body()
    requestBody: {
      filter: ExperimentFilterNode;
      include?: IncludeExperimentKeys;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Experiment[], string>> {
    const experimentManager = new ExperimentManager(request.authParams);

    const result = await experimentManager.getExperiments(
      requestBody.filter,
      requestBody.include ?? {}
    );
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

  @Post("/{experimentId}/scores")
  public async getExperimentScores(
    @Request() request: JawnAuthenticatedRequest,
    @Path() experimentId: string
  ): Promise<Result<HeliconeRequest[], string>> {
    return err("Not implemented");
  }
}
