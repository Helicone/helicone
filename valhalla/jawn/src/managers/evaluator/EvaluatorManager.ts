import {
  CreateEvaluatorParams,
  EvaluatorResult,
  TestInput,
  UpdateEvaluatorParams,
  EvaluatorStats,
} from "../../controllers/public/evaluatorController";
import { LLMAsAJudge } from "../../lib/clients/LLMAsAJudge/LLMAsAJudge";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { Result, err, ok, resultMap } from "../../packages/common/result";
import { HeliconeRequest, LlmSchema } from "@helicone-package/llm-mapper/types";
import { BaseManager } from "../BaseManager";
import { convertTestInputToHeliconeRequest } from "./convert";
import { runLastMileEvaluator } from "./lastmile/run";
import { pythonEvaluator } from "./pythonEvaluator";
import { LastMileConfigForm } from "./types";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";

export function getEvaluatorScoreName(evaluatorName: string) {
  return evaluatorName
    .toLowerCase()
    .replace(" ", "_")
    .replace(/[^a-z0-9]+/g, "_");
}

export function getFullEvaluatorScoreName(evaluatorName: string) {
  return evaluatorName
    .toLowerCase()
    .replace(" ", "_")
    .replace(/[^a-z0-9]+/g, "_");
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
}
