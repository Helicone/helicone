import {
  CreateEvaluatorParams,
  EvaluatorResult,
  UpdateEvaluatorParams,
} from "../../controllers/public/evaluatorController";
import { OPENAI_KEY } from "../../lib/clients/constant";
import { LLMAsAJudge } from "../../lib/clients/LLMAsAJudge/LLMAsAJudge";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { Result, err, ok, resultMap } from "../../lib/shared/result";
import {
  Experiment,
  ExperimentDatasetRow,
} from "../../lib/stores/experimentStore";
import { BaseManager } from "../BaseManager";
import {
  ExperimentOutputForScores,
  ExperimentV2Manager,
} from "../../managers/experiment/ExperimentV2Manager";
import { ScoreManager } from "../score/ScoreManager";
import { RequestManager } from "../request/RequestManager";

export function placeAssetIdValues(
  inputValues: Record<string, string>,
  heliconeTemplate: any
): any {
  function traverseAndTransform(obj: any): any {
    if (typeof obj === "string") {
      // Adjusted regex for <helicone-asset-id> pattern
      const regex = /<helicone-asset-id key="([^"]+)"\s*\/>/g;
      return obj.replace(regex, (match, key) => {
        // Use the key extracted from <helicone-asset-id> to fetch the replacement value
        return inputValues[key] ?? match; // Replace with value from inputValues or keep the match if not found
      });
    } else if (Array.isArray(obj)) {
      return obj.map(traverseAndTransform);
    } else if (typeof obj === "object" && obj !== null) {
      const result: { [key: string]: any } = {};
      for (const key of Object.keys(obj)) {
        result[key] = traverseAndTransform(obj[key]);
      }
      return result;
    }
    return obj; // Return the object if it doesn't match any of the above conditions
  }
  return traverseAndTransform(heliconeTemplate);
}

export function getEvaluatorScoreName(evaluatorName: string) {
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
      experiment_name: string;
    }>(
      `SELECT
      experiment.id as experiment_id,
      experiment.created_at as experiment_created_at,
      experiment.name as experiment_name
      FROM evaluator_experiments_v3
      left join experiment_v3 as experiment on evaluator_experiments_v3.experiment = experiment.id
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
    inputRecord: {
      inputs: Record<string, string>;
      autoInputs?: Record<string, string>;
    };
    run: ExperimentOutputForScores;
  }): Promise<Result<null, string>> {
    const reqManager = new RequestManager(this.authParams);
    const request = await reqManager.getRequestById(run.request_id);
    if (request.error) {
      return err(request.error);
    }

    if (!request.data?.signed_body_url) {
      return err("Request response not found");
    }

    const contentResponse = await fetch(request.data.signed_body_url);
    if (contentResponse.ok) {
      const text = await contentResponse.text();
      let content = JSON.parse(text);
      if (
        request.data.asset_urls &&
        Object.keys(request.data.asset_urls).length > 0
      ) {
        content = placeAssetIdValues(request.data.asset_urls, content);
      }

      const llmAsAJudge = new LLMAsAJudge({
        openAIApiKey: OPENAI_KEY!,
        scoringType,
        llmTemplate: evaluator.llm_template,
        inputRecord,
        output: JSON.stringify(content),
        evaluatorName: evaluator.name,
        evaluatorId: evaluator.id,
        organizationId: this.authParams.organizationId,
      });
      try {
        const result = await llmAsAJudge.evaluate();

        const scoreName = getEvaluatorScoreName(evaluator.name);

        const scoreManager = new ScoreManager(this.authParams);
        if (result.score == undefined || result.score == null) {
          return err("Score is undefined");
        }
        const requestFeedback = await scoreManager.addScores(
          run.request_id,
          {
            [scoreName]: result.score,
          },
          0,
          evaluator.id
        );

        return ok(null);
      } catch (e) {
        console.error("error evaluating", e);
        return err("Error evaluating");
      }
    }

    return err("Failed to get request response");
  }

  async runExperimentEvaluators(
    experimentId: string
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentV2Manager(this.authParams);
    const experiment = await experimentManager.hasAccessToExperiment(
      experimentId
    );
    if (!experiment) {
      return err("Unauthorized");
    }

    const evaluators = await this.getEvaluatorsForExperiment(experimentId);

    const experimentData = await experimentManager.getExperimentOutputForScores(
      experimentId
    );

    if (experimentData.error) {
      return err(experimentData.error);
    }

    const x = await Promise.all(
      experimentData.data?.map(async (request) => {
        const evaluationPromises = [];
        for (const evaluator of evaluators.data ?? []) {
          const scoreName = getEvaluatorScoreName(evaluator.name);
          if (!(request.scores && scoreName in request.scores)) {
            if (evaluator.scoring_type.startsWith("LLM")) {
              evaluationPromises.push(
                this.runLLMEvaluator({
                  scoringType: evaluator.scoring_type as
                    | "LLM-CHOICE"
                    | "LLM-BOOLEAN"
                    | "LLM-RANGE",
                  evaluator,
                  inputRecord: request.input_record,
                  run: request,
                })
              );
            }
          }
        }
        return Promise.all(evaluationPromises);
      }) ?? []
    );

    return ok(null);
  }

  async shouldRunEvaluators(
    experimentId: string
  ): Promise<Result<boolean, string>> {
    const experimentManager = new ExperimentV2Manager(this.authParams);
    const experiment = await experimentManager.hasAccessToExperiment(
      experimentId
    );
    if (!experiment) {
      return err("Unauthorized");
    }

    const evaluators = await this.getEvaluatorsForExperiment(experimentId);

    const experimentData = await experimentManager.getExperimentOutputForScores(
      experimentId
    );

    if (experimentData.error) {
      return err(experimentData.error);
    }

    if (experimentData.data?.length === 0) {
      return ok(false);
    }

    let shouldRun = false;
    for (const request of experimentData.data ?? []) {
      for (const evaluator of evaluators.data ?? []) {
        const scoreName =
          getEvaluatorScoreName(evaluator.name) +
          (evaluator.scoring_type === "LLM-BOOLEAN" ? "-hcone-bool" : "");
        if (!(request.scores && scoreName in request.scores)) {
          shouldRun = true;
        }
      }
    }
    return ok(shouldRun);
  }

  async deleteExperimentEvaluator(
    experimentId: string,
    evaluatorId: string
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentV2Manager(this.authParams);
    const experiment = await experimentManager.hasAccessToExperiment(
      experimentId
    );
    if (!experiment) {
      return err("Unauthorized");
    }
    const result = await dbExecute(
      `DELETE FROM evaluator_experiments_v3 WHERE experiment = $1 AND evaluator = $2`,
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
    const experimentManager = new ExperimentV2Manager(this.authParams);
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
      FROM evaluator_experiments_v3
      left join evaluator on evaluator_experiments_v3.evaluator = evaluator.id
      WHERE evaluator_experiments_v3.experiment = $1
      `,
      [experimentId]
    );

    return result;
  }

  async createExperimentEvaluator(
    experimentId: string,
    evaluatorId: string
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentV2Manager(this.authParams);
    const experiment = await experimentManager.hasAccessToExperiment(
      experimentId
    );
    if (!experiment) {
      return err("Unauthorized");
    }
    const result = await dbExecute<null>(
      `
      INSERT INTO evaluator_experiments_v3 (experiment, evaluator)
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
    const scoreName = getEvaluatorScoreName(params.name);
    const scoreAttributes = await dbExecute<{
      id: string;
      score_key: string;
    }>(
      `
      SELECT id, score_key
      FROM score_attributes
      WHERE score_key = $1 AND organization_id = $2
      `,
      [scoreName, this.authParams.organizationId]
    );

    if (scoreAttributes.data?.length && scoreAttributes.data.length > 0) {
      return err("Score attribute by this name already exists");
    }

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
      DELETE FROM evaluator_experiments_v3
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
      DELETE FROM evaluator_v3
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
