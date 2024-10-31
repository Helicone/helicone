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
import { ExperimentManager } from "../../managers/experiment/ExperimentManager";

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

  @Post("{datasetId}/row/insert")
  public async insertDatasetRow(
    @Body()
    requestBody: {
      inputRecordId: string;
      inputs: Record<
        string,
        { value: string; columnId: string; rowIndex: number }
      >;
      originalColumnId?: string;
    },
    @Request() request: JawnAuthenticatedRequest,
    @Path() datasetId: string
  ): Promise<Result<string, string>> {
    const datasetManager = new DatasetManager(request.authParams);
    const datasetRowResult = await datasetManager.addDatasetRow(
      datasetId,
      requestBody.inputRecordId
    );
    if (datasetRowResult.error || !datasetRowResult.data) {
      console.error(datasetRowResult.error);
      this.setStatus(500);
      return datasetRowResult;
    }
    const inputRecordResult = await datasetManager.getDatasetRowInputRecord(
      requestBody.inputRecordId
    );
    const newCells = [
      ...Object.values(requestBody.inputs).map(
        ({ value, columnId, rowIndex }) => ({
          columnId,
          rowIndex,
          value: inputRecordResult.data?.source_request ?? null,
          metadata: { datasetRowId: datasetRowResult.data },
        })
      ),
    ];
    const experimentManager = new ExperimentManager(request.authParams);
    const experimentTableCell = await experimentManager.createExperimentCells({
      cells: newCells,
    });

    if (experimentTableCell.error || !experimentTableCell.data) {
      console.error(experimentTableCell.error);
      this.setStatus(500);
    }
    this.setStatus(200);
    return ok(requestBody.inputRecordId);
  }

  @Post("{datasetId}/version/{promptVersionId}/row/new")
  public async createDatasetRow(
    @Body()
    requestBody: {
      inputs: Record<
        string,
        { value: string; columnId: string; rowIndex: number }
      >;
      rowIndex: number;
      experimentTableId: string;
      experimentId: string;
      sourceRequest?: string;
      originalColumnId?: string;
    },
    @Request() request: JawnAuthenticatedRequest,
    @Path() datasetId: string,
    @Path() promptVersionId: string
  ): Promise<Result<string, string>> {
    const inputManager = new InputsManager(request.authParams);
    const inputs = Object.fromEntries(
      Object.entries(requestBody.inputs).map(([k, { value }]) => [k, value])
    );
    const inputRecordResult = await inputManager.createInputRecord(
      promptVersionId,
      inputs,
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

    const experimentManager = new ExperimentManager(request.authParams);
    const newCells = [
      ...Object.values(requestBody.inputs).map(
        ({ value, columnId, rowIndex }) => ({
          columnId,
          rowIndex,
          value,
          metadata: { datasetRowId: datasetRowResult.data },
        })
      ),
      {
        columnId: requestBody.originalColumnId ?? "",
        rowIndex: requestBody.rowIndex,
        value: null,
        metadata: { datasetRowId: datasetRowResult.data },
      },
    ];
    const experimentTableCell = await experimentManager.createExperimentCells({
      cells: newCells,
    });

    const latestRowIndex = newCells.reduce((max, row) => {
      return Math.max(max, row.rowIndex);
    }, 0);

    await experimentManager.updateExperimentTableMetadata({
      experimentId: requestBody.experimentId,
      metadata: {
        rows: latestRowIndex,
      },
    });

    if (experimentTableCell.error || !experimentTableCell.data) {
      console.error(experimentTableCell.error);
      this.setStatus(500);
    }

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
