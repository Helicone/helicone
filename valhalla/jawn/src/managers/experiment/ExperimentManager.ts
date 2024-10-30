// src/users/usersService.ts
import {
  ExperimentRun,
  NewExperimentParams,
} from "../../controllers/public/experimentController";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { Result, err, ok } from "../../lib/shared/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { BaseManager } from "../BaseManager";
import {
  Experiment,
  ExperimentDatasetRow,
  ExperimentStore,
  ExperimentTable,
  IncludeExperimentKeys,
} from "../../lib/stores/experimentStore";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { runOriginalExperiment } from "../../lib/experiment/run";
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

  async runOriginalExperiment(params: {
    experimentId: string;
    datasetRowIds: string[];
  }): Promise<Result<ExperimentRun, string>> {
    const result = await this.getExperimentById(params.experimentId, {
      inputs: true,
      promptVersion: true,
    });

    if (result.error || !result.data) {
      return err(result.error);
    }

    const experiment = result.data;
    const datasetRows = await this.getDatasetRowsByIds({
      datasetRowIds: params.datasetRowIds,
    });

    if (datasetRows.error || !datasetRows.data) {
      console.error(datasetRows.error);
      return err(datasetRows.error);
    }

    return runOriginalExperiment(experiment, datasetRows.data);
  }

  async hasAccessToExperiment(experimentId: string): Promise<boolean> {
    const experiment = await supabaseServer.client
      .from("experiment_v2")
      .select("*")
      .eq("id", experimentId)
      .eq("organization", this.authParams.organizationId)
      .single();
    return !!experiment.data;
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
    const hasAccess = await supabaseServer.client
      .from("experiment_v2")
      .select("id", { count: "exact" })
      .eq("id", params.experimentId)
      .eq("organization", this.authParams.organizationId);

    if (hasAccess.count === 0) {
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
  }

  async addNewExperiment(
    params: NewExperimentParams
  ): Promise<Result<{ experimentId: string }, string>> {
    // TODO ensure that params.sourcePromptVersion matches the provided dataset for now...

    const experiment = await supabaseServer.client
      .from("experiment_v2")
      .insert({
        dataset: params.datasetId,
        organization: this.authParams.organizationId,
        meta: params.meta,
      })
      .select("*")
      .single();

    if (!experiment.data?.id) {
      return err("Failed to create experiment " + experiment.error?.message);
    }

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
        experiment.data.id,
        params.providerKeyId === "NOKEY" ? null : params.providerKeyId,
      ]
    );

    if (result.error) {
      return err(result.error);
    }

    return ok({ experimentId: experiment.data.id });
  }

  async createNewExperimentTable(
    params: CreateExperimentTableParams
  ): Promise<Result<{ tableId: string; experimentId: string }, string>> {
    console.log("params", params);
    const experimentTableResult =
      await this.ExperimentStore.createNewExperimentTable(
        params.datasetId,
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
          ...heliconeInputKeys.map((key) => ({
            name: key,
            type: "input",
          })),
          {
            name: "original",
            type: "output",
          },
        ] as { name: string; type: "input" | "output" }[]
      );

    return ok({
      tableId: experimentTableResult.data.experimentTableId,
      experimentId: experimentTableResult.data.experimentId,
    });
  }

  async createExperimentCells(params: {
    cells: {
      columnId: string;
      rowIndex: number;
      value: string | null;
      metadata?: Record<string, any>;
      requestId?: string;
    }[];
  }): Promise<Result<{ ids: string[] }, string>> {
    return this.ExperimentStore.createExperimentCells(params.cells);
  }

  async createExperimentTableRows(params: {
    experimentTableId: string;
    rowIndex: number;
  }): Promise<Result<{ ids: string[] }, string>> {
    return this.ExperimentStore.createExperimentTableRow(params);
  }

  async getExperimentTableById(
    experimentId: string
  ): Promise<Result<ExperimentTable, string>> {
    return this.ExperimentStore.getExperimentTableById(experimentId);
  }

  async createExperimentColumn(params: {
    experimentTableId: string;
    columnName: string;
    columnType: string;
    hypothesisId?: string;
    promptVersionId?: string;
  }): Promise<
    Result<
      {
        id: string;
      },
      string
    >
  > {
    return this.ExperimentStore.createExperimentTableColumn(
      params.experimentTableId,
      params.columnName,
      params.columnType as "experiment" | "input" | "output",
      params.hypothesisId,
      params.promptVersionId
    );
  }
}
