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
import { supabaseServer } from "../../lib/db/supabase";
import { run } from "../../lib/experiment/run";
import { FilterLeafSubset } from "../../lib/shared/filters/filterDefs";
import { Result, err } from "../../lib/shared/result";
import {
  Experiment,
  IncludeExperimentKeys,
} from "../../lib/stores/experimentStore";
import { ExperimentManager } from "../../managers/experiment/ExperimentManager";
import { JawnAuthenticatedRequest } from "../../types/request";

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
      this.setStatus(200); // set return status 201
      return {
        data: {
          experimentId: result.data.id,
        },
        error: null,
      };
    }
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
      datasetRowIds: string[];
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

    const hypothesis = experiment.hypotheses.find(
      (hypothesis) => hypothesis.id === requestBody.hypothesisId
    );

    if (!hypothesis) {
      this.setStatus(404);
      console.error("Hypothesis not found");
      return err("Hypothesis not found");
    }

    const datasetRows = await experimentManager.getDatasetRowsByIds({
      datasetRowIds: requestBody.datasetRowIds,
    });


    if (datasetRows.error || !datasetRows.data) {
      this.setStatus(500);
      console.error(datasetRows.error);
      return err(datasetRows.error);
    }

    if (datasetRows.data.length !== requestBody.datasetRowIds.length) {
      this.setStatus(404);
      console.error("Row not found");
      return err("Row not found");
    }

    experiment.dataset.rows = datasetRows.data;
    experiment.hypotheses = [hypothesis];

    const runResult = await run(experiment);

    return runResult;
  }
}
