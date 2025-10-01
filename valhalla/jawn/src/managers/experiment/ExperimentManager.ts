// src/users/usersService.ts
import { NewExperimentParams } from "../../controllers/public/experimentController";
import { AuthParams } from "../../packages/common/auth/types";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "@helicone-package/filters/filterDefs";
import { Result, err, ok } from "../../packages/common/result";
import {
  Experiment,
  ExperimentDatasetRow,
  ExperimentStore,
  ExperimentTable,
  ExperimentTableSimplified,
  IncludeExperimentKeys,
  Score,
} from "../../lib/stores/experimentStore";
import { BaseManager } from "../BaseManager";
import { PromptManager } from "../prompt/PromptManager";

export interface CreateExperimentTableParams {
  datasetId: string;
  experimentMetadata: Record<string, any>;
  promptVersionId: string;
  newHeliconeTemplate: string;
  isMajorVersion: boolean;
  promptSubversionMetadata: Record<string, any>;
  experimentTableMetadata?: Record<string, any>;
}

export class ExperimentManager extends BaseManager {
  private ExperimentStore: ExperimentStore;
  constructor(authParams: AuthParams) {
    super(authParams);
    this.ExperimentStore = new ExperimentStore(authParams.organizationId);
  }

  async hasAccessToExperiment(experimentId: string): Promise<boolean> {
    try {
      const result = await dbExecute<{ id: string }>(
        `SELECT id
         FROM experiment_v2
         WHERE id = $1
         AND organization = $2
         LIMIT 1`,
        [experimentId, this.authParams.organizationId]
      );

      return !!(result.data && result.data.length > 0);
    } catch (error) {
      console.error("Error checking experiment access:", error);
      return false;
    }
  }

  async getExperimentById(
    experimentId: string,
    include: IncludeExperimentKeys
  ): Promise<Result<Experiment, string>> {
    if (!(await this.hasAccessToExperiment(experimentId))) {
      return err("Unauthorized");
    }
    return this.ExperimentStore.getExperimentById(experimentId, include);
  }

  async getDatasetRowsByIds(params: {
    datasetRowIds: string[];
  }): Promise<Result<ExperimentDatasetRow[], string>> {
    return this.ExperimentStore.getDatasetRowsByIds(params);
  }

  async getExperiments(
    filter: FilterNode,
    include: IncludeExperimentKeys
  ): Promise<Result<Experiment[], string>> {
    return this.ExperimentStore.getExperiments(filter, include);
  }

  async createNewExperimentHypothesis(params: {
    experimentId: string;
    model: string;
    promptVersion: string;
    providerKeyId: string;
    status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  }): Promise<Result<{ hypothesisId: string }, string>> {
    try {
      // Check if user has access to the experiment
      const hasAccess = await dbExecute<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM experiment_v2
         WHERE id = $1
         AND organization = $2`,
        [params.experimentId, this.authParams.organizationId]
      );

      if (hasAccess.error || !hasAccess.data || hasAccess.data[0].count === 0) {
        return err("Experiment not found");
      }

      const result = await dbExecute<{ id: string }>(
        `
        INSERT INTO experiment_v2_hypothesis (
          prompt_version,
          model,
          status,
          experiment_v2,
          provider_key
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        `,
        [
          params.promptVersion,
          params.model,
          params.status,
          params.experimentId,
          params.providerKeyId === "NOKEY" ? null : params.providerKeyId,
        ]
      );

      if (result.error || !result.data) {
        return err(result.error);
      }

      return ok({ hypothesisId: result.data[0].id });
    } catch (error) {
      console.error("Error creating experiment hypothesis:", error);
      return err(String(error));
    }
  }

  async addNewExperiment(
    params: NewExperimentParams
  ): Promise<Result<{ experimentId: string }, string>> {
    try {
      // Create the experiment
      const experiment = await dbExecute<{ id: string }>(
        `INSERT INTO experiment_v2 (dataset, organization, meta)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [params.datasetId, this.authParams.organizationId, params.meta || null]
      );

      if (
        experiment.error ||
        !experiment.data ||
        experiment.data.length === 0
      ) {
        return err("Failed to create experiment: " + experiment.error);
      }

      const experimentId = experiment.data[0].id;

      // Create the hypothesis
      const result = await dbExecute(
        `
        INSERT INTO experiment_v2_hypothesis (
          prompt_version,
          model,
          status,
          experiment_v2,
          provider_key
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          params.promptVersion,
          params.model,
          "PENDING",
          experimentId,
          params.providerKeyId === "NOKEY" ? null : params.providerKeyId,
        ]
      );

      if (result.error) {
        return err(result.error);
      }

      return ok({ experimentId });
    } catch (error) {
      console.error("Error adding new experiment:", error);
      return err(String(error));
    }
  }

  async createNewExperimentTable(
    params: CreateExperimentTableParams
  ): Promise<
    Result<
      { tableId: string; experimentId: string; inputKeys: string[] },
      string
    >
  > {
    const experimentTableResult =
      await this.ExperimentStore.createNewExperimentTable(
        params.datasetId,
        params.experimentMetadata.experiment_name || "Experiment",
        params.experimentMetadata,
        params.experimentTableMetadata
      );

    if (experimentTableResult.error || !experimentTableResult.data) {
      return err(experimentTableResult.error);
    }

    const promptManager = new PromptManager(this.authParams);
    const newPromptVersionResult = await promptManager.createNewPromptVersion(
      params.promptVersionId,
      {
        newHeliconeTemplate: params.newHeliconeTemplate,
        isMajorVersion: params.isMajorVersion,
        metadata: params.promptSubversionMetadata,
      }
    );

    if (newPromptVersionResult.error || !newPromptVersionResult.data) {
      return err(newPromptVersionResult.error);
    }

    const heliconeInputKeys = promptManager.getHeliconeTemplateKeys(
      newPromptVersionResult.data.helicone_template
    );

    const experimentTableColumnsResult =
      await this.ExperimentStore.createExperimentTableColumns(
        experimentTableResult.data.experimentTableId,
        [
          {
            name: "inputs",
            type: "input",
          },
          {
            name: "original",
            type: "output",
            promptVersionId: params.promptVersionId,
          },
        ] as { name: string; type: "input" | "output" }[]
      );

    if (
      experimentTableColumnsResult.error ||
      !experimentTableColumnsResult.data
    ) {
      return err(
        "Failed to create experiment table columns. Make sure the prompt has any inputs."
      );
    }

    return ok({
      tableId: experimentTableResult.data.experimentTableId,
      experimentId: experimentTableResult.data.experimentId,
      inputKeys: heliconeInputKeys,
    });
  }

  async createExperimentCells(params: {
    cells: {
      columnId: string;
      rowIndex: number;
      value: string | null;
      metadata?: Record<string, any>;
    }[];
  }): Promise<Result<{ ids: string[] }, string>> {
    return this.ExperimentStore.createExperimentCells(params.cells);
  }

  async updateExperimentCells(params: {
    cells: {
      cellId: string;
      status: string | null;
      value?: string | null;
      metadata?: Record<string, any> | null;
    }[];
  }): Promise<
    Result<
      {
        cellId: string;
        status: string | null;
        value?: string | null;
        metadata?: Record<string, any> | null;
        columnName: string;
      }[],
      string
    >
  > {
    return this.ExperimentStore.updateExperimentCells(params);
  }

  async getExperimentCellsByIds(cellIds: string[]): Promise<
    Result<
      {
        cellId: string;
        status: string | null;
        value: string | null;
        metadata: Record<string, any> | null;
        rowIndex: number;
        columnId: string;
      }[],
      string
    >
  > {
    return this.ExperimentStore.getExperimentCellsByIds(cellIds);
  }

  async createExperimentTableRow(params: {
    experimentTableId: string;
    metadata?: Record<string, any>;
    inputs?: Record<string, string>;
  }): Promise<Result<{ id: string; cellType: string }[], string>> {
    const maxRowIndex = await this.ExperimentStore.getMaxRowIndex(
      params.experimentTableId
    );
    if (maxRowIndex.error || maxRowIndex.data === null) {
      return err(maxRowIndex.error ?? "Failed to get max row index");
    }

    return this.ExperimentStore.createExperimentTableRow({
      experimentTableId: params.experimentTableId,
      rowIndex: maxRowIndex.data + 1,
      metadata: params.metadata,
      inputs: params.inputs,
    });
  }

  async getExperimentTableById(
    experimentTableId: string
  ): Promise<Result<ExperimentTable, string>> {
    return this.ExperimentStore.getExperimentTable(experimentTableId);
  }

  async getExperimentTableColumns(
    experimentTableId: string
  ): Promise<Result<{ id: string; name: string }[], string>> {
    return this.ExperimentStore.getExperimentTableColumns(experimentTableId);
  }

  async getExperimentTableSimplifiedById(
    experimentTableId: string
  ): Promise<Result<ExperimentTableSimplified, string>> {
    return this.ExperimentStore.getExperimentTableById(experimentTableId);
  }

  async getExperimentTables(): Promise<
    Result<ExperimentTableSimplified[], string>
  > {
    return this.ExperimentStore.getExperimentTables();
  }

  async updateExperimentTableMetadata(params: {
    experimentTableId: string;
    metadata: Record<string, any>;
  }): Promise<Result<null, string>> {
    return this.ExperimentStore.updateExperimentTableMetadata(params);
  }

  async createExperimentColumn(params: {
    experimentTableId: string;
    columnName: string;
    columnType: string;
    hypothesisId?: string;
    promptVersionId?: string;
    inputKeys?: string[];
  }): Promise<
    Result<
      {
        id: string;
      },
      string
    >
  > {
    const experimentTableResult = await this.getExperimentTableSimplifiedById(
      params.experimentTableId
    );
    if (experimentTableResult.error || !experimentTableResult.data) {
      return err(experimentTableResult.error);
    }
    const experimentColumnResult =
      await this.ExperimentStore.createExperimentTableColumn(
        params.experimentTableId,
        params.columnName,
        params.columnType as "experiment" | "input" | "output",
        params.hypothesisId,
        params.promptVersionId,
        params.inputKeys
      );

    if (experimentColumnResult.error || !experimentColumnResult.data) {
      return err(experimentColumnResult.error);
    }

    await this.createExperimentCells({
      cells: Array.from(
        { length: (experimentTableResult.data.metadata as any)?.rows + 1 },
        (_, index) => ({
          columnId: experimentColumnResult.data.id,
          rowIndex: index,
          value: null,
        })
      ),
    });

    return ok({ id: experimentColumnResult.data.id });
  }

  async getExperimentHypothesisScores(params: {
    hypothesisId: string;
  }): Promise<
    Result<{ runsCount: number; scores: Record<string, Score> }, string>
  > {
    return this.ExperimentStore.getExperimentHypothesisScores(params);
  }

  async createExperimentTableRowWithCellsBatch(params: {
    experimentTableId: string;
    rows: {
      metadata?: Record<string, any>;
      cells: {
        columnId: string;
        value: string | null;
        metadata?: Record<string, any>;
      }[];
      sourceRequest?: string;
    }[];
  }): Promise<Result<{ ids: string[] }, string>> {
    return this.ExperimentStore.createExperimentTableRowsWithCells(params);
  }

  async deleteExperimentTableRow(params: {
    experimentTableId: string;
    rowIndex: number;
  }): Promise<Result<null, string>> {
    return this.ExperimentStore.softDeleteExperimentTableRow(params);
  }
}
