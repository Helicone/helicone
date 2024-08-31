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
import {
  HeliconeDataset,
  HeliconeDatasetRow,
  MutateParams,
} from "../../managers/dataset/HeliconeDatasetManager";
import { Json } from "../../lib/db/database.types";

export type DatasetFilterBranch = {
  left: DatasetFilterNode;
  operator: "or" | "and";
  right: DatasetFilterNode;
};
type DatasetFilterNode =
  | FilterLeafSubset<"request" | "prompts_versions">
  | DatasetFilterBranch
  | "all";

export interface HeliconeDatasetMetadata {
  promptVersionId?: string;
  inputRecordsIds?: string[];
}

export interface NewHeliconeDatasetParams {
  datasetName: string;
  requestIds: string[];
  meta?: HeliconeDatasetMetadata;
}

export interface DatasetResult {
  id: string;
  name: string;
  created_at: string;
  meta?: HeliconeDatasetMetadata;
}

@Route("v1/helicone-dataset")
@Tags("Dataset")
@Security("api_key")
export class HeliconeDatasetController extends Controller {
  @Post("/")
  public async addHeliconeDataset(
    @Body()
    requestBody: NewHeliconeDatasetParams,
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

    const result = await datasetManager.addDataset({
      ...requestBody,
      datasetType: "helicone",
    });
    // const result = await promptManager.getPrompts(requestBody);
    if (result.error || !result.data) {
      console.log(result.error);
      this.setStatus(500);
      return err(result.error ?? "");
    } else {
      this.setStatus(200); // set return status 201
      return ok({
        datasetId: result.data,
      });
    }
  }

  @Post("/{datasetId}/mutate")
  public async mutateHeliconeDataset(
    @Path()
    datasetId: string,
    @Body()
    requestBody: MutateParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const datasetManager = new DatasetManager(request.authParams);
    const result = await datasetManager.helicone.mutate(datasetId, requestBody);
    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    } else {
      this.setStatus(200); // set return status 201
      return ok(null);
    }
  }

  @Post("/{datasetId}/query")
  public async queryHeliconeDatasetRows(
    @Path()
    datasetId: string,
    @Body()
    requestBody: {
      offset: number;
      limit: number;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HeliconeDatasetRow[], string>> {
    const datasetManager = new DatasetManager(request.authParams);
    const result = await datasetManager.helicone.query(datasetId, requestBody);
    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    } else {
      this.setStatus(200); // set return status 201
      return ok(result.data!);
    }
  }

  @Post("/{datasetId}/count")
  public async countHeliconeDatasetRows(
    @Path()
    datasetId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<number, string>> {
    const datasetManager = new DatasetManager(request.authParams);
    const result = await datasetManager.helicone.count(datasetId);
    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    } else {
      this.setStatus(200); // set return status 201
      return ok(result.data!);
    }
  }

  @Post("/query")
  public async queryHeliconeDataset(
    @Body()
    requestBody: {
      datasetIds?: string[];
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HeliconeDataset[], string>> {
    const datasetManager = new DatasetManager(request.authParams);

    const result = await datasetManager.helicone.getDatasets(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error);
    } else {
      this.setStatus(200); // set return status 201
      return ok(result.data);
    }
  }

  @Post("/{datasetId}/request/{requestId}")
  public async updateHeliconeDatasetRequest(
    @Path()
    datasetId: string,
    @Path()
    requestId: string,
    @Body() requestBody: { requestBody: Json; responseBody: Json },
    @Request() request: JawnAuthenticatedRequest
  ) {
    const datasetManager = new DatasetManager(request.authParams);
    const result = await datasetManager.helicone.updateDatasetRequest(
      datasetId,
      requestId,
      requestBody
    );
    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    }
    this.setStatus(200);
    return ok(null);
  }
}
