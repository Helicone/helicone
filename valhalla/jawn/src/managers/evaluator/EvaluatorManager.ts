import {
  CreateEvaluatorParams,
  EvaluatorResult,
  TestInput,
  UpdateEvaluatorParams,
  EvaluatorStats,
} from "../../controllers/public/evaluatorController";
import { LLMAsAJudge } from "../../lib/clients/LLMAsAJudge/LLMAsAJudge";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { Result, err, ok, resultMap } from "../../lib/shared/result";
import {
  ExperimentOutputForScores,
  ExperimentV2Manager,
} from "../../managers/experiment/ExperimentV2Manager";
import { HeliconeRequest, LlmSchema } from "../../packages/llm-mapper/types";
import { BaseManager } from "../BaseManager";
import { RequestManager } from "../request/RequestManager";
import { ScoreManager } from "../score/ScoreManager";
import { convertTestInputToHeliconeRequest } from "./convert";
import { runLastMileEvaluator } from "./lastmile/run";
import { pythonEvaluator } from "./pythonEvaluator";
import { LastMileConfigForm } from "./types";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";
import { ceil, floor, range } from "lodash";

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

export function getFullEvaluatorScoreName(
  evaluatorName: string,
  isBoolean: boolean
) {
  return (
    evaluatorName
      .toLowerCase()
      .replace(" ", "_")
      .replace(/[^a-z0-9]+/g, "_") + (isBoolean ? "-hcone-bool" : "")
  );
}

export class EvaluatorManager extends BaseManager {
  testLastMileEvaluator({
    config,
    testInput,
  }: {
    config: LastMileConfigForm;
    testInput: TestInput;
  }) {
    return runLastMileEvaluator(
      convertTestInputToHeliconeRequest(testInput),
      config,
      testInput.inputs
    );
  }
  testPythonEvaluator({
    code,
    requestBodyString,
    responseString,
  }: {
    code: string;
    requestBodyString: string;
    responseString: string;
  }) {
    return pythonEvaluator({
      code,
      requestBodyString,
      responseString,
      orgId: this.authParams.organizationId,
      uniqueId: "0",
    });
  }
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

  async runLLMEvaluatorScore({
    evaluator,
    inputRecord,
    request_id,
    requestBody,
    responseBody,
    heliconeRequest,
  }: {
    evaluator: EvaluatorResult;
    inputRecord: {
      inputs: Record<string, string>;
      autoInputs?: Record<string, string>;
    };
    request_id: string;
    requestBody: LlmSchema;
    responseBody: LlmSchema;
    heliconeRequest: HeliconeRequest;
  }): Promise<Result<{ score: number | boolean }, string>> {
    if (evaluator.last_mile_config) {
      return runLastMileEvaluator(heliconeRequest, evaluator.last_mile_config, {
        inputs: inputRecord.inputs,
        autoInputs: inputRecord.autoInputs,
      });
    } else if (evaluator.llm_template) {
      const llmAsAJudge = new LLMAsAJudge({
        scoringType: evaluator.scoring_type as
          | "LLM-CHOICE"
          | "LLM-BOOLEAN"
          | "LLM-RANGE",
        llmTemplate: evaluator.llm_template,
        inputRecord,
        outputBody: JSON.stringify(responseBody),
        inputBody: JSON.stringify(requestBody),
        promptTemplate: evaluator.llm_template.promptTemplate,
        evaluatorName: evaluator.name,
        organizationId: this.authParams.organizationId,
      });
      const result = await llmAsAJudge.evaluate();
      if (result.error) {
        return err(result.error);
      }
      return ok({ score: result.data!.score });
    } else if (evaluator.code_template) {
      const codeResult = await pythonEvaluator({
        code: evaluator.code_template,
        requestBodyString: JSON.stringify(requestBody),
        responseString: JSON.stringify(responseBody),
        uniqueId: request_id,
        orgId: this.authParams.organizationId,
      });
      if (codeResult.error) {
        return err(codeResult.error);
      }
      if (codeResult.data?.output == undefined) {
        return err("Score is undefined");
      }
      if (codeResult.data?.output.toLowerCase() === "true") {
        return ok({ score: true });
      } else if (codeResult.data?.output.toLowerCase() === "false") {
        return ok({ score: false });
      } else {
        return ok({ score: +codeResult.data?.output });
      }
    } else {
      return err("Evaluator type not supported");
    }
  }

  private async getContent(requestId: string): Promise<
    Result<
      {
        requestBody: string;
        responseBody: string;
      },
      string
    >
  > {
    const reqManager = new RequestManager(this.authParams);
    const request = await reqManager.uncachedGetRequestByIdWithBody(requestId);

    if (request.error) {
      return err(request.error);
    }

    if (!request.data?.signed_body_url) {
      return err("Request response not found");
    }

    if (
      request.data.asset_urls &&
      Object.keys(request.data.asset_urls).length > 0
    ) {
      request.data.request_body = placeAssetIdValues(
        request.data.asset_urls,
        request.data.request_body
      );
    }
    return ok({
      requestBody: request.data.request_body,
      responseBody: request.data.response_body,
    });
  }

  private async runEvaluatorAndPostScore({
    evaluator,
    inputRecord,
    run,
    requestBody,
    responseBody,
  }: {
    evaluator: EvaluatorResult;
    inputRecord: {
      inputs: Record<string, string>;
      autoInputs?: Record<string, string>;
    };
    run: ExperimentOutputForScores;
    requestBody: any;
    responseBody: any;
  }): Promise<Result<null, string>> {
    try {
      const scoreResult = await this.runLLMEvaluatorScore({
        evaluator,
        inputRecord,
        request_id: run.request_id,
        requestBody,
        responseBody,
        heliconeRequest: {
          request_id: run.request_id,
          request_created_at: new Date().toISOString(),
          request_body: requestBody,
          request_path: "",
          request_user_id: null,
          request_properties: null,
          request_model: null,
          model_override: null,
          response_id: null,
          response_created_at: null,
          response_status: 200,
          response_model: null,
          helicone_user: null,
          provider: "OPENAI",
          delay_ms: null,
          time_to_first_token: null,
          total_tokens: null,
          prompt_tokens: null,
          prompt_cache_write_tokens: null,
          prompt_cache_read_tokens: null,
          completion_tokens: null,
          prompt_id: null,
          llmSchema: null,
          country_code: null,
          asset_ids: null,
          asset_urls: null,
          response_body: responseBody,
          scores: {},
          properties: {},
          assets: [],
          target_url: "",
          model: "gpt-3.5-turbo",
        },
      });
      if (scoreResult.error) {
        return err(scoreResult.error);
      }

      const isBoolean = evaluator.scoring_type === "LLM-BOOLEAN";
      const scoreName = getFullEvaluatorScoreName(evaluator.name, isBoolean);

      const scoreManager = new ScoreManager(this.authParams);
      if (
        scoreResult.data?.score == undefined ||
        scoreResult.data?.score == null
      ) {
        return err("Score is undefined");
      }
      const requestFeedback = await scoreManager.addScores(
        run.request_id,
        {
          [scoreName]: scoreResult.data?.score,
        },
        0,
        evaluator.id
      );

      return ok(null);
    } catch (e) {
      console.error("error evaluating", e);
      return err("Error evaluating" + JSON.stringify(e));
    }
  }

  async runEvaluator(
    evaluator: EvaluatorResult,
    inputRecord: {
      inputs: Record<string, string>;
      autoInputs?: Record<string, string>;
    },
    run: ExperimentOutputForScores
  ) {
    const content = await this.getContent(run.request_id);
    if (content.error) {
      return err(content.error);
    }
    return this.runEvaluatorAndPostScore({
      evaluator,
      inputRecord,
      run,
      requestBody: content.data?.requestBody ?? "",
      responseBody: content.data?.responseBody ?? "",
    });
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
        const content = await this.getContent(request.request_id);
        if (content.error) {
          return err(content.error);
        }
        const evaluationPromises: Promise<Result<null, string>>[] = [];
        for (const evaluator of evaluators.data ?? []) {
          const isBoolean = evaluator.scoring_type === "LLM-BOOLEAN";
          const scoreName = getFullEvaluatorScoreName(
            evaluator.name,
            isBoolean
          );
          if (!(request.scores && scoreName in request.scores)) {
            evaluationPromises.push(
              this.runEvaluatorAndPostScore({
                evaluator,
                inputRecord: request.input_record,
                run: request,
                requestBody: content.data?.requestBody ?? "",
                responseBody: content.data?.responseBody ?? "",
              })
            );
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
        const isBoolean = evaluator.scoring_type === "LLM-BOOLEAN";
        const scoreName = getFullEvaluatorScoreName(evaluator.name, isBoolean);
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
        evaluator.name,
        evaluator.code_template,
        evaluator.last_mile_config
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
    const result = await dbExecute<EvaluatorResult>(
      `
      INSERT INTO evaluator (scoring_type, llm_template, organization_id, name, code_template, last_mile_config)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at, scoring_type, llm_template, organization_id, updated_at, name, last_mile_config
      `,
      [
        params.scoring_type,
        params.llm_template,
        this.authParams.organizationId,
        params.name,
        params.code_template,
        params.last_mile_config,
      ]
    );

    return resultMap(result, (data) => data[0]);
  }

  async getEvaluator(
    evaluatorId: string
  ): Promise<Result<EvaluatorResult, string>> {
    const result = await dbExecute<EvaluatorResult>(
      `
      SELECT id, created_at, scoring_type, llm_template, organization_id, updated_at, last_mile_config, name
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
      SELECT id, created_at, scoring_type, llm_template, organization_id, updated_at, name, code_template, last_mile_config
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

    if (params.code_template !== undefined) {
      updateFields.push(`code_template = $${paramIndex++}`);
      updateValues.push(params.code_template);
    }

    if (params.last_mile_config !== undefined) {
      updateFields.push(`last_mile_config = $${paramIndex++}`);
      updateValues.push(params.last_mile_config);
    }

    if (updateFields.length === 0) {
      return err("No fields to update");
    }

    const result = await dbExecute<EvaluatorResult>(
      `
      UPDATE evaluator
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++}
      RETURNING id, created_at, scoring_type, llm_template, organization_id, updated_at, last_mile_config
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

    const deleteOldExperimentEvaluators = await dbExecute(
      `
      DELETE FROM evaluator_experiments
      WHERE evaluator = $1
      `,
      [evaluatorId]
    );
    if (deleteOldExperimentEvaluators.error) {
      return err(
        `Failed to delete old experiment evaluators: ${deleteOldExperimentEvaluators.error}`
      );
    }

    const deleteOnlineEvaluators = await dbExecute(
      `
      DELETE FROM online_evaluators
      WHERE evaluator = $1 and organization = $2
      `,
      [evaluatorId, this.authParams.organizationId]
    );
    if (deleteOnlineEvaluators.error) {
      return err(
        `Failed to delete online evaluators: ${deleteOnlineEvaluators.error}`
      );
    }

    const setNullScoreAttributes = await dbExecute(
      `
      UPDATE score_attribute
      SET evaluator_id = NULL
      WHERE evaluator_id = $1 and organization = $2
      `,
      [evaluatorId, this.authParams.organizationId]
    );
    if (setNullScoreAttributes.error) {
      return err(
        `Failed to set null score attributes: ${setNullScoreAttributes.error}`
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

  public async getEvaluatorStats(
    evaluatorId: string
  ): Promise<Result<EvaluatorStats, string>> {
    try {
      // First, get the evaluator to verify it exists and get the name for scoring
      const evaluator = await this.getEvaluator(evaluatorId);
      if (evaluator.error || !evaluator.data) {
        return err(evaluator.error || "Evaluator not found");
      }

      // If name or scoring_type is missing, return default stats instead of error
      if (!evaluator.data.name || !evaluator.data.scoring_type) {
        console.warn(
          `Evaluator ${evaluatorId} has missing name or scoring_type, returning default stats`
        );
        return ok({
          averageScore: 0,
          totalUses: 0,
          recentTrend: "stable",
          scoreDistribution: [],
          timeSeriesData: [],
        });
      }

      // Get evaluator name for scoring using getFullEvaluatorScoreName function
      const isBoolean = evaluator.data.scoring_type === "LLM-BOOLEAN";
      const scoreName = getFullEvaluatorScoreName(
        evaluator.data.name,
        isBoolean
      );

      // Query to get the average score and total uses from clickhouse
      const statsQuery = `
        SELECT
          avg(mapValues(scores)[indexOf(mapKeys(scores), {val_0: String})]) as average_score,
          count(*) as total_uses
        FROM request_response_rmt
        WHERE organization_id = {val_1: String}
          AND has(mapKeys(scores), {val_0: String})
      `;

      const statsResult = await dbQueryClickhouse<{
        average_score: number;
        total_uses: number;
      }>(statsQuery, [scoreName, this.authParams.organizationId]);

      if (
        statsResult.error ||
        !statsResult.data ||
        statsResult.data.length === 0
      ) {
        // If no data, return default stats
        return ok({
          averageScore: 0,
          totalUses: 0,
          recentTrend: "stable",
          scoreDistribution: [],
          timeSeriesData: [],
        });
      }

      // Query recent trend - compare last week to previous week
      const recentTrendQuery = `
        WITH 
          now() AS current_time,
          subtractWeeks(current_time, 1) AS one_week_ago,
          subtractWeeks(current_time, 2) AS two_weeks_ago
        SELECT
          avg(IF(request_created_at >= one_week_ago, mapValues(scores)[indexOf(mapKeys(scores), {val_0: String})], NULL)) as recent_avg,
          avg(IF(request_created_at >= two_weeks_ago AND request_created_at < one_week_ago, mapValues(scores)[indexOf(mapKeys(scores), {val_0: String})], NULL)) as previous_avg
        FROM request_response_rmt
        WHERE organization_id = {val_1: String}
          AND has(mapKeys(scores), {val_0: String})
          AND request_created_at >= two_weeks_ago
      `;

      const trendResult = await dbQueryClickhouse<{
        recent_avg: number;
        previous_avg: number;
      }>(recentTrendQuery, [scoreName, this.authParams.organizationId]);

      let trend: "up" | "down" | "stable" = "stable";
      if (trendResult.data && trendResult.data.length > 0) {
        const { recent_avg, previous_avg } = trendResult.data[0];
        if (recent_avg > previous_avg) {
          trend = "up";
        } else if (recent_avg < previous_avg) {
          trend = "down";
        }
      }

      // Query score distribution - 5 buckets
      const distributionQuery = `
        SELECT
          concat(toString(bucket * 20), '-', toString((bucket + 1) * 20)) as range,
          count(*) as count
        FROM (
          SELECT
            floor(mapValues(scores)[indexOf(mapKeys(scores), {val_0: String})] / 20) as bucket
          FROM request_response_rmt
          WHERE organization_id = {val_1: String}
            AND has(mapKeys(scores), {val_0: String})
        )
        GROUP BY bucket
        ORDER BY bucket
      `;

      const distributionResult = await dbQueryClickhouse<{
        range: string;
        count: number;
      }>(distributionQuery, [scoreName, this.authParams.organizationId]);

      const scoreDistribution = distributionResult.data || [];

      // Query time series data - last 30 days
      const timeSeriesQuery = `
        SELECT
          toDate(request_created_at) as date,
          avg(mapValues(scores)[indexOf(mapKeys(scores), {val_0: String})]) as value
        FROM request_response_rmt
        WHERE organization_id = {val_1: String}
          AND has(mapKeys(scores), {val_0: String})
          AND request_created_at >= subtractDays(now(), 30)
        GROUP BY date
        ORDER BY date
      `;

      const timeSeriesResult = await dbQueryClickhouse<{
        date: string;
        value: number;
      }>(timeSeriesQuery, [scoreName, this.authParams.organizationId]);

      const timeSeriesData = timeSeriesResult.data || [];

      // Return the combined stats
      return ok({
        averageScore: statsResult.data[0].average_score,
        totalUses: statsResult.data[0].total_uses,
        recentTrend: trend,
        scoreDistribution,
        timeSeriesData,
      });
    } catch (error) {
      console.error("Error getting evaluator stats:", error);
      return err("Error fetching evaluator statistics");
    }
  }
}
