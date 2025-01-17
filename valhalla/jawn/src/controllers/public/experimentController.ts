// src/users/usersController.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { supabaseServer } from "../../lib/db/supabase";
import { FilterLeafSubset } from "../../lib/shared/filters/filterDefs";
import { Result, err, ok } from "../../lib/shared/result";
import {
  Experiment,
  ExperimentTable,
  ExperimentTableSimplified,
  IncludeExperimentKeys,
  Score,
} from "../../lib/stores/experimentStore";
import { DatasetManager } from "../../managers/dataset/DatasetManager";
import { EvaluatorManager } from "../../managers/evaluator/EvaluatorManager";
import {
  CreateExperimentTableParams,
  ExperimentManager,
} from "../../managers/experiment/ExperimentManager";
import { InputsManager } from "../../managers/inputs/InputsManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { EvaluatorResult } from "./evaluatorController";

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
  @Post("/new-empty")
  public async createNewEmptyExperiment(
    @Body()
    requestBody: {
      metadata: Record<string, string>;
      datasetId: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      {
        experimentId: string;
      },
      string
    >
  > {
    const result = await supabaseServer.client
      .from("experiment_v2")
      .insert({
        dataset: requestBody.datasetId,
        organization: request.authParams.organizationId,
        meta: requestBody.metadata,
      })
      .select("*")
      .single();

    // const result = await promptManager.getPrompts(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error.message);
    } else {
      await supabaseServer.client.from("experiment_table").insert({
        experiment_id: result.data.id,
        name: "Experiment Table",
        organization_id: request.authParams.organizationId,
        metadata: {
          datasetId: requestBody.datasetId,
        },
      });
      this.setStatus(200); // set return status 201
      return {
        data: {
          experimentId: result.data.id,
        },
        error: null,
      };
    }
  }

  @Post("/table/new")
  public async createNewExperimentTable(
    @Body()
    requestBody: CreateExperimentTableParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      {
        tableId: string;
        experimentId: string;
      },
      string
    >
  > {
    const experimentManager = new ExperimentManager(request.authParams);
    const result = await experimentManager.createNewExperimentTable(
      requestBody
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error);
    }
    const inputManager = new InputsManager(request.authParams);
    const inputRecordResult = await inputManager.createInputRecord(
      requestBody.promptVersionId,
      {}
    );

    if (inputRecordResult.error || !inputRecordResult.data) {
      this.setStatus(500);
      console.error(inputRecordResult.error);
      return err(inputRecordResult.error ?? "Failed to create input record");
    }

    const datasetManager = new DatasetManager(request.authParams);
    const datasetRowResult = await datasetManager.addDatasetRow(
      (requestBody.experimentTableMetadata as any)?.datasetId,
      inputRecordResult.data
    );

    if (datasetRowResult.error || !datasetRowResult.data) {
      console.error(datasetRowResult.error);
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    const inputs = Object.fromEntries(
      result.data.inputKeys.map((key) => [key, ""])
    );
    const experimentTableRowResult =
      await experimentManager.createExperimentTableRow({
        experimentTableId: result.data.tableId,
        metadata: {
          datasetRowId: datasetRowResult.data,
          inputId: inputRecordResult.data,
        },
        inputs,
      });

    if (experimentTableRowResult.error || !experimentTableRowResult.data) {
      this.setStatus(500);
      console.error(experimentTableRowResult.error);
      return err(experimentTableRowResult.error);
    }

    const inputCellId = experimentTableRowResult.data.find(
      (cell) => cell.cellType === "input"
    )?.id;

    if (!inputCellId) {
      this.setStatus(500);
      return err("Failed to find input cell");
    }

    const inputCellResult = await experimentManager.updateExperimentCells({
      cells: [
        {
          cellId: inputCellId,
          status: "initialized",
          value: "inputs",
          metadata: {
            inputs: result.data.inputKeys.map((key) => ({
              key,
              value: "",
            })),
          },
        },
      ],
    });

    if (inputCellResult.error || !inputCellResult.data) {
      this.setStatus(500);
      console.error(inputCellResult.error);
      return err(inputCellResult.error);
    }

    this.setStatus(200);
    return ok({
      tableId: result.data.tableId,
      experimentId: result.data.experimentId,
    });
  }

  @Post("/table/{experimentTableId}/query")
  public async getExperimentTableById(
    @Path() experimentTableId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExperimentTable, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    return experimentManager.getExperimentTableById(experimentTableId);
  }
  @Post("/table/{experimentTableId}/metadata/query")
  public async getExperimentTableMetadata(
    @Path() experimentTableId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExperimentTableSimplified, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    return experimentManager.getExperimentTableSimplifiedById(
      experimentTableId
    );
  }
  @Post("/tables/query")
  public async getExperimentTables(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExperimentTableSimplified[], string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    return experimentManager.getExperimentTables();
  }

  @Post("/table/{experimentTableId}/cell")
  public async createExperimentCell(
    @Path() experimentTableId: string,
    @Body()
    requestBody: {
      columnId: string;
      rowIndex: number;
      value: string | null;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    const experimentTable =
      await experimentManager.getExperimentTableSimplifiedById(
        experimentTableId
      );
    if (experimentTable.error || !experimentTable.data) {
      this.setStatus(500);
      console.error(experimentTable.error);
      return err(experimentTable.error);
    }
    const result = await experimentManager.createExperimentCells({
      cells: [requestBody],
    });
    if (result.error) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error);
    }
    this.setStatus(204);
    return ok(null);
  }

  @Patch("/table/{experimentTableId}/cell")
  public async updateExperimentCell(
    @Path() experimentTableId: string,
    @Body()
    requestBody: {
      cellId: string;
      status?: string;
      value?: string;
      metadata?: string;
      updateInputs?: boolean;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    const experimentTable =
      await experimentManager.getExperimentTableSimplifiedById(
        experimentTableId
      );
    if (experimentTable.error || !experimentTable.data) {
      this.setStatus(500);
      console.error(experimentTable.error);
      return err(experimentTable.error);
    }
    const result = await experimentManager.updateExperimentCells({
      cells: [
        {
          cellId: requestBody.cellId,
          status: requestBody.status ?? null,
          value: requestBody.value ?? null,
          metadata: requestBody.metadata
            ? JSON.parse(requestBody.metadata)
            : null,
        },
      ],
    });
    if (result.error || !result.data) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error);
    }

    if (requestBody.updateInputs) {
      const inputManager = new InputsManager(request.authParams);
      await Promise.all(
        result.data.map((cell) => {
          if (cell.metadata?.inputId && cell.metadata.inputs) {
            // Transform the inputs array into a Record<string, string>
            const inputData = Object.fromEntries(
              cell.metadata.inputs.map(
                (input: { key: string; value: string }) => [
                  input.key,
                  input.value ?? "",
                ]
              )
            );

            return inputManager.updateInputRecord(
              cell.metadata.inputId,
              inputData
            );
          }
        })
      );
    }

    this.setStatus(204);
    return ok(null);
  }

  @Post("/table/{experimentTableId}/column")
  public async createExperimentColumn(
    @Path() experimentTableId: string,
    @Body()
    requestBody: {
      columnName: string;
      columnType: string;
      hypothesisId?: string;
      promptVersionId?: string;
      inputKeys?: string[];
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    const experimentTable =
      await experimentManager.getExperimentTableSimplifiedById(
        experimentTableId
      );
    if (experimentTable.error || !experimentTable.data) {
      this.setStatus(500);
      console.error(experimentTable.error);
      return err(experimentTable.error);
    }

    const experimentTableColumns =
      await experimentManager.getExperimentTableColumns(experimentTableId);
    if (experimentTableColumns.error || !experimentTableColumns.data) {
      this.setStatus(500);
      console.error(experimentTableColumns.error);
      return err(experimentTableColumns.error);
    }
    // const missingInputKeys = requestBody.inputKeys?.filter(
    //   (key) => !experimentTableColumns.data.map((col) => col.name).includes(key)
    // );

    // if (missingInputKeys && missingInputKeys.length > 0) {
    //   await Promise.all(
    //     missingInputKeys.map(async (key) => {
    //       return experimentManager.createExperimentColumn({
    //         experimentTableId,
    //         columnName: key,
    //         columnType: "input",
    //         inputKeys: [key],
    //       });
    //     })
    //   );
    // }

    const result = await experimentManager.createExperimentColumn({
      experimentTableId,
      columnName: requestBody.columnName,
      columnType: requestBody.columnType,
      hypothesisId: requestBody.hypothesisId,
      promptVersionId: requestBody.promptVersionId,
    });

    if (result.error) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error);
    }

    this.setStatus(204);
    return ok(null);
  }

  @Post("/table/{experimentTableId}/row/new")
  public async createExperimentTableRow(
    @Path() experimentTableId: string,
    @Body()
    requestBody: {
      promptVersionId: string;
      sourceRequest?: string;
      inputs?: Record<string, string>;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    const experimentTable =
      await experimentManager.getExperimentTableSimplifiedById(
        experimentTableId
      );

    if (experimentTable.error || !experimentTable.data) {
      this.setStatus(500);
      console.error(experimentTable.error);
      return err(experimentTable.error);
    }

    const inputManager = new InputsManager(request.authParams);
    const inputRecordResult = await inputManager.createInputRecord(
      requestBody.promptVersionId,
      {},
      requestBody.sourceRequest
    );
    if (inputRecordResult.error || !inputRecordResult.data) {
      this.setStatus(500);
      console.error(inputRecordResult.error);
      return err(inputRecordResult.error);
    }

    const datasetManager = new DatasetManager(request.authParams);
    const datasetRowResult = await datasetManager.addDatasetRow(
      (experimentTable.data?.metadata as any)?.datasetId,
      inputRecordResult.data
    );

    if (datasetRowResult.error || !datasetRowResult.data) {
      console.error(datasetRowResult.error);
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    const result = await experimentManager.createExperimentTableRow({
      experimentTableId,
      metadata: {
        datasetRowId: datasetRowResult.data,
        inputId: inputRecordResult.data,
      },
      inputs: requestBody.inputs,
    });

    if (!result.data || result.error) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error);
    }

    const inputCell = result.data.find((cell) => cell.cellType === "input");
    if (inputCell) {
      await experimentManager.updateExperimentCells({
        cells: [
          {
            cellId: inputCell.id,
            value: "inputs",
            status: "initialized",
            metadata: {
              inputs: Object.entries(requestBody.inputs ?? {}).map(
                ([key, value]) => ({
                  key,
                  value: "",
                })
              ),
            },
          },
        ],
      });
    }

    return ok(null);
  }

  @Delete("/table/{experimentTableId}/row/{rowIndex}")
  public async deleteExperimentTableRow(
    @Path() experimentTableId: string,
    @Path() rowIndex: number,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    const experimentTable =
      await experimentManager.getExperimentTableSimplifiedById(
        experimentTableId
      );
    if (experimentTable.error || !experimentTable.data) {
      this.setStatus(500);
      console.error(experimentTable.error);
      return err(experimentTable.error);
    }
    const result = await experimentManager.deleteExperimentTableRow({
      experimentTableId,
      rowIndex,
    });
    return result;
  }

  @Post("/table/{experimentTableId}/row/insert/batch")
  public async createExperimentTableRowWithCellsBatch(
    @Path() experimentTableId: string,
    @Body()
    requestBody: {
      rows: {
        inputRecordId: string;
        inputs: Record<string, string>;
        datasetId: string;
        cells: {
          columnId: string;
          value: string | null;
          metadata?: any;
        }[];
        sourceRequest?: string;
      }[];
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    const experimentTable =
      await experimentManager.getExperimentTableSimplifiedById(
        experimentTableId
      );

    if (experimentTable.error || !experimentTable.data) {
      this.setStatus(500);
      console.error(experimentTable.error);
      return err(experimentTable.error);
    }

    const datasetManager = new DatasetManager(request.authParams);

    // Process dataset rows in parallel
    const datasetRowPromises = requestBody.rows.map((row) =>
      datasetManager.addDatasetRow(row.datasetId, row.inputRecordId)
    );

    const datasetRowResults = await Promise.all(datasetRowPromises);

    // Check for errors
    for (let i = 0; i < datasetRowResults.length; i++) {
      const result = datasetRowResults[i];
      if (result.error || !result.data) {
        console.error(result.error);
        this.setStatus(500);
        return err(result.error);
      }
    }

    // Prepare the rows with metadata
    const rowsWithMetadata = requestBody.rows.map((row, index) => ({
      metadata: {
        datasetRowId: datasetRowResults[index].data,
        inputId: row.inputRecordId,
        cellType: "input",
      },
      cells: row.cells,
      sourceRequest: row.sourceRequest,
    }));

    // Now call the bulk insertion function
    const result =
      await experimentManager.createExperimentTableRowWithCellsBatch({
        experimentTableId,
        rows: rowsWithMetadata,
      });

    if (result.error || !result.data) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error);
    }
    return ok(null);
  }

  @Post("/update-meta")
  public async updateExperimentMeta(
    @Body()
    requestBody: {
      experimentId: string;
      meta: Record<string, string>;
    },
    @Request() request: JawnAuthenticatedRequest
  ) {
    const result = await supabaseServer.client
      .from("experiment_v2")
      .update({ meta: requestBody.meta })
      .eq("id", requestBody.experimentId)
      .eq("organization", request.authParams.organizationId);

    if (result.error || !result.data) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error);
    } else {
      this.setStatus(200);
      return result;
    }
  }

  @Post("/")
  public async createNewExperimentOld(
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

  @Post("/hypothesis")
  public async createNewExperimentHypothesis(
    @Body()
    requestBody: {
      experimentId: string;
      model: string;
      promptVersion: string;
      providerKeyId: string;
      status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ hypothesisId: string }, string>> {
    const experimentManager = new ExperimentManager(request.authParams);

    const result = await experimentManager.createNewExperimentHypothesis(
      requestBody
    );

    if (result.error) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error);
    } else {
      this.setStatus(200);
      return result;
    }
  }

  @Post("/hypothesis/{hypothesisId}/scores/query")
  public async getExperimentHypothesisScores(
    @Path() hypothesisId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<{ runsCount: number; scores: Record<string, Score> }, string>
  > {
    const experimentManager = new ExperimentManager(request.authParams);
    const result = await experimentManager.getExperimentHypothesisScores({
      hypothesisId,
    });
    return result;
  }

  @Get("/{experimentId}/evaluators")
  public async getExperimentEvaluators(
    @Path() experimentId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<EvaluatorResult[], string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.getEvaluatorsForExperiment(
      experimentId
    );
    return result;
  }

  @Post("/{experimentId}/evaluators/run")
  public async runExperimentEvaluatorsOld(
    @Path() experimentId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.runExperimentEvaluators(experimentId);
    return result;
  }

  @Post("/{experimentId}/evaluators")
  public async createExperimentEvaluatorOld(
    @Path() experimentId: string,
    @Body()
    requestBody: {
      evaluatorId: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.createExperimentEvaluator(
      experimentId,
      requestBody.evaluatorId
    );
    return result;
  }

  @Delete("/{experimentId}/evaluators/{evaluatorId}")
  public async deleteExperimentEvaluatorOld(
    @Path() experimentId: string,
    @Path() evaluatorId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.deleteExperimentEvaluator(
      experimentId,
      evaluatorId
    );
    return result;
  }

  @Post("/query")
  public async getExperimentsOld(
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
}
