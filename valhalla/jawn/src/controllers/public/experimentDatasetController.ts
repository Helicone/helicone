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
import { Result, err, ok } from "../../lib/shared/result";
import {
  FilterLeafSubset,
  FilterNode,
} from "../../lib/shared/filters/filterDefs";
import { DatasetManager } from "../../managers/dataset/DatasetManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { randomUUID } from "crypto";
import { InputsManager } from "../../managers/inputs/InputsManager";

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

  @Post("{datasetId}/version/{promptVersionId}/row")
  public async createDatasetRow(
    @Body()
    requestBody: {
      inputs: Record<string, string>;
      sourceRequest?: string;
    },
    @Request() request: JawnAuthenticatedRequest,
    @Path() datasetId: string,
    @Path() promptVersionId: string
  ): Promise<Result<string, string>> {
    const inputManager = new InputsManager(request.authParams);
    const inputRecordResult = await inputManager.createInputRecord(
      promptVersionId,
      requestBody.inputs,
      requestBody.sourceRequest
    );

    if (inputRecordResult.error || !inputRecordResult.data) {
      console.error(inputRecordResult.error);
      this.setStatus(500);
      return inputRecordResult;
    }

    const datasetManager = new DatasetManager(request.authParams);
    const datasetRowResult = await datasetManager.addDatasetRow(
      datasetId,
      inputRecordResult.data
    );

    if (datasetRowResult.error || !datasetRowResult.data) {
      console.error(datasetRowResult.error);
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return inputRecordResult;
  }

  @Post("/{datasetId}/inputs/query")
  public async getDataset(
    // @Body() requestBody: {},
    @Request() request: JawnAuthenticatedRequest,
    @Path() datasetId: string
  ) {
    const inputManager = new InputsManager(request.authParams);
    return inputManager.getInputsFromDataset(datasetId, 1_000);
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
