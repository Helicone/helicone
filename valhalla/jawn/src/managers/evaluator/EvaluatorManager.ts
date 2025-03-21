import {
  CreateEvaluatorParams,
  EvaluatorResult,
  TestInput,
  UpdateEvaluatorParams,
  EvaluatorStats,
  LLMJudgeConfig,
  isLLMBooleanConfig,
  isLLMRangeConfig,
  isLLMChoiceConfig,
} from "../../controllers/public/evaluatorController";
import { LLMAsAJudge } from "../../lib/clients/LLMAsAJudge/LLMAsAJudge";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { Result, err, isError, isSuccess, ok, resultMap } from "../../lib/shared/result";
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
import { buildFilterWithAuthClickHouse } from "../../lib/shared/filters/filters";
import { TimeFilter } from "../../lib/shared/filters/timeFilter";
import { timeFilterToFilterNode } from "../../lib/shared/filters/filterDefs";

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
) {
  return (
    evaluatorName
      .toLowerCase()
      .replace(" ", "_")
      .replace(/[^a-z0-9]+/g, "_")
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

      const scoreName = getFullEvaluatorScoreName(evaluator.name);

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
          const scoreName = getFullEvaluatorScoreName(evaluator.name);
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
        const scoreName = getFullEvaluatorScoreName(evaluator.name);
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
      INSERT INTO evaluator (scoring_type, llm_template, organization_id, name, code_template, last_mile_config, description, model, judge_config)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at, scoring_type, llm_template, organization_id, updated_at, name, last_mile_config, description, model, judge_config
      `,
      [
        params.scoring_type,
        params.llm_template,
        this.authParams.organizationId,
        params.name,
        params.code_template,
        params.last_mile_config,
        params.description,
        params.model,
        params.judge_config,
      ]
    );

    return resultMap(result, (data) => data[0]);
  }

  async getEvaluator(
    evaluatorId: string
  ): Promise<Result<EvaluatorResult, string>> {
    const result = await dbExecute<EvaluatorResult>(
      `
      SELECT id, created_at, scoring_type, llm_template, organization_id, updated_at, last_mile_config, name, description, model, judge_config
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
      SELECT id, created_at, scoring_type, llm_template, organization_id, updated_at, name, code_template, last_mile_config, description, model, judge_config
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

    if (params.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(params.description);
    }

    if (params.model !== undefined) {
      updateFields.push(`model = $${paramIndex++}`);
      updateValues.push(params.model);
    }

    if (params.judge_config !== undefined) {
      updateFields.push(`judge_config = $${paramIndex++}`);
      updateValues.push(params.judge_config);
    }

    if (updateFields.length === 0) {
      return err("No fields to update");
    }

    const result = await dbExecute<EvaluatorResult>(
      `
      UPDATE evaluator
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex++} AND organization_id = $${paramIndex++}
      RETURNING id, created_at, scoring_type, llm_template, organization_id, updated_at, last_mile_config, name, description, model, judge_config
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

      const scoreName = getFullEvaluatorScoreName(evaluator.data.name);

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

  public async getEvaluatorStatsWithFilter(
    evaluatorId: string,
    timeFilter: TimeFilter,
  ): Promise<Result<EvaluatorStats, string>> {
    // Only allow 31 days to prevent excessive load
    if (timeFilter.start && timeFilter.end) {
      const daysDifference = Math.ceil((timeFilter.end.getTime() - timeFilter.start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDifference > 31) {
        return err("Time range cannot exceed 31 days");
      }
    }
    try {
      const evaluator = await this.getEvaluator(evaluatorId);
      if (evaluator.error || !evaluator.data) {
        return err(evaluator.error || "Evaluator not found");
      }

      if (!evaluator.data.name || !evaluator.data.scoring_type) {
        console.warn(
          `Evaluator ${evaluatorId} has missing name or scoring_type, returning default stats`
        );
        return err("Evaluator has missing name or scoring_type");
      }

      const isBoolean = evaluator.data.scoring_type === "LLM-BOOLEAN";
      const scoreName = getFullEvaluatorScoreName(
        evaluator.data.name,
      );

      const builtFilter = await buildFilterWithAuthClickHouse({
        org_id: this.authParams.organizationId,
        filter: timeFilter ? timeFilterToFilterNode(timeFilter, "request_response_rmt") : "all",
        argsAcc: [],
      });

      // hardcoded to 1 and 2 because we only have 2 params in the filter
      const startTimeParamIdx = 1;
      const endTimeParamIdx = 2;
      const scoreParamIdx = builtFilter.argsAcc.length;
      builtFilter.argsAcc.push(scoreName);
      const scoreFilter = `AND has(mapKeys(scores), {val_${scoreParamIdx} : String})`;
      
      // Query to get the average score and total uses from clickhouse
      const statsQuery = `
        SELECT
          avg(mapValues(scores)[indexOf(mapKeys(scores), {val_${scoreParamIdx} : String})]) as average_score,
          count(*) as total_uses
        FROM request_response_rmt
        WHERE ((${builtFilter.filter}))
          ${scoreFilter}
      `;

      const statsResult = await dbQueryClickhouse<{
        average_score: number;
        total_uses: number;
      }>(statsQuery, builtFilter.argsAcc);

      if (
        statsResult.error ||
        !statsResult.data ||
        statsResult.data.length === 0
      ) {
        console.error("Could not query stats, error:", statsResult.error);
        return err("Could not query stats");
      }
      
      const recentTrendQuery = `
        WITH 
          {val_${startTimeParamIdx} : DateTime} AS start_time,
          {val_${endTimeParamIdx} : DateTime} AS end_time,
          addSeconds(start_time, toInt32((toUnixTimestamp(end_time) - toUnixTimestamp(start_time)) / 2)) AS mid_time
        SELECT
          avg(IF(request_created_at >= mid_time AND request_created_at <= end_time, mapValues(scores)[indexOf(mapKeys(scores), {val_${scoreParamIdx} : String})], NULL)) as recent_avg,
          avg(IF(request_created_at >= start_time AND request_created_at < mid_time, mapValues(scores)[indexOf(mapKeys(scores), {val_${scoreParamIdx} : String})], NULL)) as previous_avg
        FROM request_response_rmt
        WHERE ((${builtFilter.filter}))
          ${scoreFilter}
      `;

      const trendResult = await dbQueryClickhouse<{
        recent_avg: number;
        previous_avg: number;
      }>(recentTrendQuery, builtFilter.argsAcc);

      let trend: "up" | "down" | "stable" = "stable";
      if (trendResult.data && trendResult.data.length > 0) {
        const { recent_avg, previous_avg } = trendResult.data[0];
        if (recent_avg > previous_avg) {
          trend = "up";
        } else if (recent_avg < previous_avg) {
          trend = "down";
        }
      }

      // Query score distribution
      if (!evaluator.data.judge_config) {
        // alternatively, we could try to parse the raw text of llm_template to get the judge config
        // (this would happen if e.g. the evaluator was created before the monitoring feature was released)
        return err("Evaluator has no judge config, please re-create it");
      }
      const distributionQuery = this.getFilteredDistributionQuery(builtFilter.filter, scoreParamIdx, scoreFilter, evaluator.data.judge_config, isBoolean);
      if (isError(distributionQuery)) {
        console.error("Could not query distribution, error:", distributionQuery.error);
        return err(distributionQuery.error);
      }

      const distributionResult = await dbQueryClickhouse<{
        range: string;
        count: number;
      }>(distributionQuery.data, builtFilter.argsAcc);

      const scoreDistribution = distributionResult.data || [];

      // Get the appropriate time granularity based on the time range
      const dateTimeFunction = this.getDateTimeFunction(timeFilter);

      // Query time series data with appropriate granularity
      const timeSeriesQuery = `
        SELECT
          ${dateTimeFunction} as date,
          avg(mapValues(scores)[indexOf(mapKeys(scores), {val_${scoreParamIdx} : String})]) as value
        FROM request_response_rmt
        WHERE ((${builtFilter.filter}))
          ${scoreFilter}
        GROUP BY date
        ORDER BY date
      `;

      const timeSeriesResult = await dbQueryClickhouse<{
        date: string;
        value: number;
      }>(timeSeriesQuery, builtFilter.argsAcc);

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

  /**
   * Gets the appropriate date/time function for ClickHouse queries based on the time range
   * @param timeFilter The time filter containing start and end dates
   * @returns The appropriate ClickHouse date/time function to use
   */
    private getDateTimeFunction(timeFilter: TimeFilter): string {
      if (timeFilter.start && timeFilter.end) {
        const millisDifference = timeFilter.end.getTime() - timeFilter.start.getTime();
        const hoursDifference = millisDifference / (1000 * 60 * 60);
        
        if (hoursDifference <= 1) {
          // Every 1min when range < 1 hour
          return 'toStartOfMinute(request_created_at)';
        } else if (hoursDifference <= 12) {
          // Every 5min when range < 12 hours
          return 'toStartOfFiveMinutes(request_created_at)';
        } else if (hoursDifference <= 72) {
          // Every 1hr when range < 3 days
          return 'toStartOfHour(request_created_at)';
        } else if (hoursDifference <= 168) {
          // Every 4hr when range < 7 days
          return 'toDateTime(toStartOfInterval(request_created_at, INTERVAL 4 hour))';
        } else {
          // Every day when range > 7 days
          return 'toDate(request_created_at)';
        }
      }
      
      // Default to daily if no time range specified
      return 'toDate(request_created_at)';
    }

  getFilteredDistributionQuery(builtFilter: string, scoreParamIdx: number, scoreFilter: string, llmJudgeConfig?: LLMJudgeConfig, isBoolean: boolean = false): Result<string, string> {
    if (isBoolean || llmJudgeConfig && isLLMBooleanConfig(llmJudgeConfig)) {
      return ok(`
        SELECT
          toString(bucket) as range,
          count(*) as count
        FROM (
          SELECT
            mapValues(scores)[indexOf(mapKeys(scores), {val_${scoreParamIdx} : String})] as bucket
          FROM request_response_rmt
          WHERE ((${builtFilter}))
            ${scoreFilter}
        )
        GROUP BY bucket
        ORDER BY bucket
      `);
    } else if (llmJudgeConfig && isLLMRangeConfig(llmJudgeConfig)) {
      const bucketSize = Math.ceil((llmJudgeConfig.rangeMax - llmJudgeConfig.rangeMin) / 5);
      return ok(`
        SELECT
          concat(toString(bucket * ${bucketSize}), '-', toString((bucket + 1) * ${bucketSize})) as range,
          count(*) as count
        FROM (
          SELECT
            floor(mapValues(scores)[indexOf(mapKeys(scores), {val_${scoreParamIdx} : String})] / ${bucketSize}) as bucket
          FROM request_response_rmt
          WHERE ((${builtFilter}))
            ${scoreFilter}
        )
        GROUP BY bucket
        ORDER BY bucket
      `);
    } else if (llmJudgeConfig && isLLMChoiceConfig(llmJudgeConfig)) {
      return ok(`
        WITH choice_mapping AS (
          SELECT 
            arrayJoin([${llmJudgeConfig.choices.map((choice, idx) => `(${idx}, ${choice.score})`).join(', ')}]) AS choice_map
        )
        SELECT
          toString(choice_map.2) as range,
          count(*) as count
        FROM (
          SELECT
            mapValues(scores)[indexOf(mapKeys(scores), {val_${scoreParamIdx} : String})] as bucket
          FROM request_response_rmt
          WHERE ((${builtFilter}))
            ${scoreFilter}
        ) scores_data
        LEFT JOIN choice_mapping choice_map ON choice_map.1 = scores_data.bucket
        GROUP BY range
        ORDER BY min(scores_data.bucket)
      `);
    }

    return err("Invalid judge config");
  }
}
