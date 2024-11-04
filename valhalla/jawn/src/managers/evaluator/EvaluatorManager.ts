import {
  CreateEvaluatorParams,
  EvaluatorResult,
  UpdateEvaluatorParams,
} from "../../controllers/public/evaluatorController";
import { LLMAsAJudge } from "../../lib/clients/LLMAsAJudge/LLMAsAJudge";
import { generateHeliconeAPIKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { Result, err, ok, resultMap } from "../../lib/shared/result";
import {
  Experiment,
  ExperimentDatasetRow,
} from "../../lib/stores/experimentStore";
import { BaseManager } from "../BaseManager";
import { ExperimentManager } from "../experiment/ExperimentManager";
import { RequestManager } from "../request/RequestManager";
import { ScoreManager } from "../score/ScoreManager";

function getEvaluatorScoreName(evaluatorName: string) {
  return evaluatorName
    .toLowerCase()
    .replace(" ", "_")
    .replace(/[^a-z0-9]+/g, "_");
}

export class EvaluatorManager extends BaseManager {
  async getExperiments(evaluatorId: string) {
    const result = await dbExecute<{
      experiment_id: string;
      experiment_created_at: string;
    }>(
      `SELECT
      experiment.id as experiment_id,
      experiment.created_at as experiment_created_at
      FROM evaluator_experiments
      left join experiment_v2 as experiment on evaluator_experiments.experiment = experiment.id
      WHERE evaluator = $1
      AND experiment.organization = $2
      `,
      [evaluatorId, this.authParams.organizationId]
    );
    return result;
  }
  private async runLLMEvaluator({
    scoringType,
    evaluator,
    inputRecord,
    run,
  }: {
    scoringType: "LLM-CHOICE" | "LLM-BOOLEAN" | "LLM-RANGE";
    evaluator: EvaluatorResult;
    inputRecord: ExperimentDatasetRow["inputRecord"];
    run: Experiment["hypotheses"][number]["runs"][number];
  }): Promise<Result<null, string>> {
    const llmAsAJudge = new LLMAsAJudge({
      openAIApiKey: process.env.OPENAI_API_KEY!,
      scoringType,
      llmTemplate: evaluator.llm_template,
      inputRecord,
      output: JSON.stringify(run.response?.body),
      evaluatorName: evaluator.name,
    });
    const result = await llmAsAJudge.evaluate();

    const scoreName = getEvaluatorScoreName(evaluator.name);

    const reqManager = new ScoreManager(this.authParams);
    const requestFeedback = await reqManager.addScores(
      run.resultRequestId,
      {
        [scoreName]: result.score,
      },
      0
    );

    return ok(null);
  }

  async runExperimentEvaluators(
    experimentId: string
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(this.authParams);
    const experiment = await experimentManager.hasAccessToExperiment(
      experimentId
    );
    if (!experiment) {
      return err("Unauthorized");
    }

    const evaluators = await this.getEvaluatorsForExperiment(experimentId);

    const experimentData = await experimentManager.getExperimentById(
      experimentId,
      {
        responseBodies: true,
        inputs: true,
        score: true,
      }
    );

    const x = await Promise.all(
      experimentData.data?.hypotheses.map(async (hypothesis) => {
        return await Promise.all(
          hypothesis?.runs?.map(async (run) => {
            for (const evaluator of evaluators.data ?? []) {
              const scoreName = getEvaluatorScoreName(evaluator.name);
              if (!(run.scores && scoreName in run.scores)) {
                if (evaluator.scoring_type.startsWith("LLM")) {
                  const datasetRow = experimentData.data?.dataset?.rows.find(
                    (row) => row.rowId === run.datasetRowId
                  );

                  if (datasetRow) {
                    const evaluatorResult = await this.runLLMEvaluator({
                      scoringType: evaluator.scoring_type as
                        | "LLM-CHOICE"
                        | "LLM-BOOLEAN"
                        | "LLM-RANGE",
                      evaluator: evaluator,
                      inputRecord: datasetRow.inputRecord,
                      run: run,
                    });
                  }
                }
              }
            }
          })
        );
      }) ?? []
    );

    return ok(null);
  }

  async deleteExperimentEvaluator(
    experimentId: string,
    evaluatorId: string
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(this.authParams);
    const experiment = await experimentManager.hasAccessToExperiment(
      experimentId
    );
    if (!experiment) {
      return err("Unauthorized");
    }
    const result = await dbExecute(
      `DELETE FROM evaluator_experiments WHERE experiment = $1 AND evaluator = $2`,
      [experimentId, evaluatorId]
    );
    if (result.error) {
      return err(`Failed to delete evaluator experiment: ${result.error}`);
    }
    return ok(null);
  }
  async getEvaluatorsForExperiment(
    experimentId: string
  ): Promise<Result<EvaluatorResult[], string>> {
    const experimentManager = new ExperimentManager(this.authParams);
    const experiment = await experimentManager.hasAccessToExperiment(
      experimentId
    );
    if (!experiment) {
      return err("Unauthorized");
    }

    const result = await dbExecute<EvaluatorResult>(
      `
      SELECT 
        evaluator.id,
        evaluator.created_at,
        evaluator.scoring_type,
        evaluator.llm_template,
        evaluator.organization_id,
        evaluator.updated_at,
        evaluator.name
      FROM evaluator_experiments 
      left join evaluator on evaluator_experiments.evaluator = evaluator.id
      WHERE evaluator_experiments.experiment = $1
      `,
      [experimentId]
    );

    return result;
  }

  async createExperimentEvaluator(
    experimentId: string,
    evaluatorId: string
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentManager(this.authParams);
    const experiment = await experimentManager.hasAccessToExperiment(
      experimentId
    );
    if (!experiment) {
      return err("Unauthorized");
    }
    const result = await dbExecute<null>(
      `
      INSERT INTO evaluator_experiments (experiment, evaluator)
      VALUES ($1, $2)
      `,
      [experimentId, evaluatorId]
    );

    if (result.error) {
      return err(`Failed to create evaluator experiment: ${result.error}`);
    }
    return ok(null);
  }

  async createEvaluator(
    params: CreateEvaluatorParams
  ): Promise<Result<EvaluatorResult, string>> {
    const result = await dbExecute<EvaluatorResult>(
      `
      INSERT INTO evaluator (scoring_type, llm_template, organization_id, name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at, scoring_type, llm_template, organization_id, updated_at, name
      `,
      [
        params.scoring_type,
        params.llm_template,
        this.authParams.organizationId,
        params.name,
      ]
    );

    return resultMap(result, (data) => data[0]);
  }

  async getEvaluator(
    evaluatorId: string
  ): Promise<Result<EvaluatorResult, string>> {
    const result = await dbExecute<EvaluatorResult>(
      `
      SELECT id, created_at, scoring_type, llm_template, organization_id, updated_at
      FROM evaluator
      WHERE id = $1 AND organization_id = $2
      `,
      [evaluatorId, this.authParams.organizationId]
    );

    return resultMap(result, (data) => data[0]);
  }

  async queryEvaluators(): Promise<Result<EvaluatorResult[], string>> {
    const result = await dbExecute<EvaluatorResult>(
      `
      SELECT id, created_at, scoring_type, llm_template, organization_id, updated_at, name
      FROM evaluator
      WHERE organization_id = $1
      ORDER BY created_at DESC
      `,
      [this.authParams.organizationId]
    );

    return result;
  }

  async updateEvaluator(
    evaluatorId: string,
    params: UpdateEvaluatorParams
  ): Promise<Result<EvaluatorResult, string>> {
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (params.scoring_type !== undefined) {
      updateFields.push(`scoring_type = $${paramIndex++}`);
      updateValues.push(params.scoring_type);
    }

    if (params.llm_template !== undefined) {
      updateFields.push(`llm_template = $${paramIndex++}`);
      updateValues.push(params.llm_template);
    }

    if (updateFields.length === 0) {
      return err("No fields to update");
    }

    const result = await dbExecute<EvaluatorResult>(
      `
      UPDATE evaluator
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++}
      RETURNING id, created_at, scoring_type, llm_template, organization_id, updated_at
      `,
      [...updateValues, evaluatorId, this.authParams.organizationId]
    );

    return resultMap(result, (data) => data[0]);
  }

  async deleteEvaluator(evaluatorId: string): Promise<Result<null, string>> {
    const deleteExperimentEvaluator = await dbExecute(
      `
      DELETE FROM evaluator_experiments
      WHERE evaluator = $1
      `,
      [evaluatorId]
    );
    if (deleteExperimentEvaluator.error) {
      return err(
        `Failed to delete evaluator experiments: ${deleteExperimentEvaluator.error}`
      );
    }

    const result = await dbExecute(
      `
      DELETE FROM evaluator
      WHERE id = $1 AND organization_id = $2
      `,
      [evaluatorId, this.authParams.organizationId]
    );

    if (result.error) {
      return err(`Failed to delete evaluator: ${result.error}`);
    }

    return ok(null);
  }
}
