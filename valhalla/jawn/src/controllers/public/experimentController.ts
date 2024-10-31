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
import { run, runOriginalExperiment } from "../../lib/experiment/run";
import { FilterLeafSubset } from "../../lib/shared/filters/filterDefs";
import { Result, err, ok } from "../../lib/shared/result";
import {
  Experiment,
  ExperimentTable,
  ExperimentTableSimplified,
  IncludeExperimentKeys,
  Score,
} from "../../lib/stores/experimentStore";
import {
  CreateExperimentTableParams,
  ExperimentManager,
} from "../../managers/experiment/ExperimentManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { EvaluatorResult } from "./evaluatorController";
import { EvaluatorManager } from "../../managers/evaluator/EvaluatorManager";

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

  @Post("/new-experiment-table")
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
    return result;
  }

  @Post("/table/{experimentTableId}/query")
  public async getExperimentTableById(
    @Path() experimentTableId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExperimentTable, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    return experimentManager.getExperimentTableByExperimentId(
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
    @Body() requestBody: { cellId: string; status?: string; value?: string },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    const result = await experimentManager.updateExperimentCells({
      cells: [
        {
          cellId: requestBody.cellId,
          status: requestBody.status ?? null,
          value: requestBody.value ?? null,
        },
      ],
    });
    if (result.error) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error);
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
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
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

  @Post("/table/{experimentTableId}/row")
  public async createExperimentTableRow(
    @Path() experimentTableId: string,
    @Body()
    requestBody: {
      rowIndex: number;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(request.authParams);
    const result = await experimentManager.createExperimentTableRow({
      experimentTableId,
      rowIndex: requestBody.rowIndex,
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
  ): Promise<Result<{ scores: Record<string, Score> }, string>> {
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
  public async runExperimentEvaluators(
    @Path() experimentId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.runExperimentEvaluators(experimentId);
    return result;
  }

  @Post("/{experimentId}/evaluators")
  public async createExperimentEvaluator(
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
  public async deleteExperimentEvaluator(
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

  @Post("/run")
  public async runExperiment(
    @Body()
    requestBody: {
      experimentId: string;
      hypothesisId: string;
      cells: Array<{
        rowIndex: number;
        datasetRowId: string;
        columnId: string;
        cellId: string;
      }>;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExperimentRun, string>> {
    const experimentManager = new ExperimentManager(request.authParams);

    const result = await experimentManager.getExperimentById(
      requestBody.experimentId,
      {
        inputs: true,
        promptVersion: true,
      }
    );

    if (result.error || !result.data) {
      this.setStatus(500);
      console.error(result.error);
      return err("Not implemented");
    }

    const experiment = result.data;

    const datasetRows = await experimentManager.getDatasetRowsByIds({
      datasetRowIds: requestBody.cells.map((cell) => cell.datasetRowId),
    });

    if (datasetRows.error || !datasetRows.data) {
      this.setStatus(500);
      console.error(datasetRows.error);
      return err(datasetRows.error);
    }

    if (datasetRows.data.length !== requestBody.cells.length) {
      this.setStatus(404);
      console.error("Row not found");
      return err("Row not found");
    }

    const newDatasetRows = datasetRows.data.map((row, index) => {
      const cellData = requestBody.cells.find(
        (x) => x.datasetRowId === row.rowId
      );
      return {
        ...row,
        rowIndex: cellData?.rowIndex ?? 0,
        columnId: cellData?.columnId ?? "",
      };
    });

    experiment.dataset.rows = newDatasetRows;

    if (requestBody.hypothesisId === "original") {
      return runOriginalExperiment(experiment, newDatasetRows);
    }

    const hypothesis = experiment.hypotheses.find(
      (hypothesis) => hypothesis.id === requestBody.hypothesisId
    );

    if (!hypothesis) {
      this.setStatus(404);
      console.error("Hypothesis not found");
      return err("Hypothesis not found");
    }

    experiment.hypotheses = [hypothesis];

    const runResult = await run(experiment);

    const cellsToUpdate = requestBody.cells.map((cell) => {
      return {
        cellId: cell.cellId,
        status: "running",
      };
    });

    const statusUpdateResult = await experimentManager.updateExperimentCells({
      cells: cellsToUpdate,
    });

    if (statusUpdateResult.error) {
      this.setStatus(500);
      console.error(statusUpdateResult.error);
      return err(statusUpdateResult.error);
    }

    return runResult;
  }
}
