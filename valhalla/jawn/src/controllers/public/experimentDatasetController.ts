// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { Result, err, ok } from "../../lib/shared/result";
import {
  FilterLeafSubset,
  FilterNode,
} from "../../lib/shared/filters/filterDefs";
import { DatasetManager } from "../../managers/dataset/DatasetManager";
import { JawnAuthenticatedRequest } from "../../types/request";

export type DatasetFilterBranch = {
  left: DatasetFilterNode;
  operator: "or" | "and";
  right: DatasetFilterNode;
};
type DatasetFilterNode =
  | FilterLeafSubset<"request" | "prompts_versions">
  | DatasetFilterBranch
  | "all";

export interface DatasetMetadata {
  promptVersionId?: string;
  inputRecordsIds?: string[];
}

export interface NewDatasetParams {
  datasetName: string;
  requestIds: string[];
  datasetType: "experiment" | "helicone";
  meta?: DatasetMetadata;
}

export interface DatasetResult {
  id: string;
  name: string;
  created_at: string;
  meta?: DatasetMetadata;
}

export interface RandomDatasetParams {
  datasetName: string;
  filter: DatasetFilterNode;
  offset?: number;
  limit?: number;
}

@Route("v1/experiment/dataset")
@Tags("Dataset")
@Security("api_key")
export class ExperimentDatasetController extends Controller {
  @Post("/")
  public async addDataset(
    @Body()
    requestBody: NewDatasetParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      {
        datasetId: string;
      },
      string
    >
  > {
    const datasetManager = new DatasetManager(request.authParams);

    const result = await datasetManager.addDataset(requestBody);
    // const result = await promptManager.getPrompts(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err("Not implemented");
    } else {
      this.setStatus(200); // set return status 201
      return ok({
        datasetId: result.data,
      });
    }
  }

  @Post("/random")
  public async addRandomDataset(
    @Body()
    requestBody: RandomDatasetParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      {
        datasetId: string;
      },
      string
    >
  > {
    const datasetManager = new DatasetManager(request.authParams);

    const result = await datasetManager.addRandomDataset(requestBody);
    // const result = await promptManager.getPrompts(requestBody);
    if (result.error) {
      this.setStatus(500);
      console.error(result.error);
      return err("Not implemented");
    } else {
      this.setStatus(200); // set return status 201
      return ok(result.data!);
    }
  }

  @Post("/query")
  public async getDatasets(
    @Body()
    requestBody: {
      promptVersionId?: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<DatasetResult[], string>> {
    const datasetManager = new DatasetManager(request.authParams);
    const result = await datasetManager.getDatasets(
      requestBody.promptVersionId
    );
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Post("/{datasetId}/query")
  public async getDataset(
    @Body()
    requestBody: {},
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{}[], string>> {
    return err("Not implemented");
  }

  @Post("/{datasetId}/mutate")
  public async mutateDataset(
    @Body()
    requestBody: {
      addRequests: string[];
      removeRequests: string[];
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{}[], string>> {
    return err("Not implemented");
  }
}
