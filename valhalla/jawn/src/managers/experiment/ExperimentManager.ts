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
  SimplifiedExperiment,
  IncludeExperimentKeys,
} from "../../lib/stores/experimentStore";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { run, runOriginalExperiment } from "../../lib/experiment/run";

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

  async getExperimentsV2(
    filter: FilterNode
  ): Promise<Result<SimplifiedExperiment[], string>> {
    return this.ExperimentStore.getSimplifiedExperiment(filter);
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
}
