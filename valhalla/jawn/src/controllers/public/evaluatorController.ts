import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { err, ok, Result, resultMap } from "../../lib/shared/result";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { JawnAuthenticatedRequest } from "../../types/request";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { EvaluatorManager } from "../../managers/evaluator/EvaluatorManager";
import {
  EvaluatorConfig,
  OnlineEvalStore,
  OnlineEvaluatorByEvaluatorId,
} from "../../lib/stores/OnlineEvalStore";
import {
  LLMAsAJudge,
  EvaluatorScoreResult,
} from "../../lib/clients/LLMAsAJudge/LLMAsAJudge";
import { OPENAI_KEY } from "../../lib/clients/constant";
import { LastMileConfigForm } from "../../managers/evaluator/types";

export interface CreateEvaluatorParams {
  scoring_type: string;
  llm_template?: any;
  name: string;
  code_template?: any;
  last_mile_config?: any;
}

export interface UpdateEvaluatorParams {
  scoring_type?: string;
  llm_template?: any;
  code_template?: any;
  name?: string;
  last_mile_config?: any;
}

export interface EvaluatorResult {
  id: string;
  created_at: string;
  scoring_type: string;
  llm_template: any;
  organization_id: string;
  updated_at: string;
  name: string;
  code_template: any;
  last_mile_config: any;
}

type EvaluatorExperiment = {
  experiment_id: string;
  experiment_created_at: string;
  experiment_name: string;
};

type CreateOnlineEvaluatorParams = {
  config: Record<string, any>;
};

export type TestInput = {
  inputBody: string;
  outputBody: string;

  inputs: {
    inputs: Record<string, string>;
    autoInputs?: Record<string, string>;
  };
  promptTemplate?: string;
};

export interface EvaluatorStats {
  averageScore: number;
  totalUses: number;
  recentTrend: "up" | "down" | "stable";
  scoreDistribution: Array<{
    range: string;
    count: number;
  }>;
  timeSeriesData: Array<{
    date: string;
    value: number;
  }>;
}

@Route("v1/evaluator")
@Tags("Evaluator")
@Security("api_key")
export class EvaluatorController extends Controller {
  @Post("/")
  public async createEvaluator(
    @Body() requestBody: CreateEvaluatorParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<EvaluatorResult, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.createEvaluator(requestBody);

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(201);
    }
    return result;
  }

  @Get("{evaluatorId}")
  public async getEvaluator(
    @Request() request: JawnAuthenticatedRequest,
    @Path() evaluatorId: string
  ): Promise<Result<EvaluatorResult, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.getEvaluator(evaluatorId);

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("query")
  public async queryEvaluators(
    @Body() requestBody: {},
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<EvaluatorResult[], string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.queryEvaluators();

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Put("{evaluatorId}")
  public async updateEvaluator(
    @Path() evaluatorId: string,
    @Body() requestBody: UpdateEvaluatorParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<EvaluatorResult, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.updateEvaluator(
      evaluatorId,
      requestBody
    );

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Delete("{evaluatorId}")
  public async deleteEvaluator(
    @Request() request: JawnAuthenticatedRequest,
    @Path() evaluatorId: string
  ): Promise<Result<null, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.deleteEvaluator(evaluatorId);

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(204);
    }
    return result;
  }

  @Get("{evaluatorId}/experiments")
  public async getExperimentsForEvaluator(
    @Request() request: JawnAuthenticatedRequest,
    @Path() evaluatorId: string
  ): Promise<Result<EvaluatorExperiment[], string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.getExperiments(evaluatorId);

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Get("{evaluatorId}/onlineEvaluators")
  public async getOnlineEvaluators(
    @Request() request: JawnAuthenticatedRequest,
    @Path() evaluatorId: string
  ): Promise<Result<OnlineEvaluatorByEvaluatorId[], string>> {
    const onlineEvalStore = new OnlineEvalStore(
      request.authParams.organizationId
    );
    const result = await onlineEvalStore.getOnlineEvaluatorsByEvaluatorId(
      evaluatorId
    );

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("{evaluatorId}/onlineEvaluators")
  public async createOnlineEvaluator(
    @Request() request: JawnAuthenticatedRequest,
    @Path() evaluatorId: string,
    @Body() requestBody: CreateOnlineEvaluatorParams
  ): Promise<Result<null, string>> {
    const sampleRate = requestBody.config?.sampleRate ?? 100;

    if (typeof sampleRate !== "number" || sampleRate < 0 || sampleRate > 100) {
      this.setStatus(400);
      return err("Sample rate must be between 0 and 100");
    }

    const propertyFilters = requestBody.config?.propertyFilters ?? [];

    if (!Array.isArray(propertyFilters)) {
      this.setStatus(400);
      return err("Property filters must be an array");
    }

    for (const propertyFilter of propertyFilters) {
      if (
        typeof propertyFilter !== "object" ||
        typeof propertyFilter.key !== "string" ||
        typeof propertyFilter.value !== "string"
      ) {
        this.setStatus(400);
        return err(
          "Property filters must be an array of objects with key and value properties"
        );
      }
    }

    const result = await dbExecute(
      `INSERT INTO online_evaluators (evaluator, organization, config)
        VALUES ($1, $2, $3)`,
      [
        evaluatorId,
        request.authParams.organizationId,
        JSON.stringify({
          sampleRate,
          propertyFilters: propertyFilters.map((propertyFilter) => ({
            key: propertyFilter.key,
            value: propertyFilter.value,
          })),
        }),
      ]
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error || "Failed to fetch evals");
    } else {
      this.setStatus(200);
      return ok(null);
    }
  }

  @Delete("{evaluatorId}/onlineEvaluators/{onlineEvaluatorId}")
  public async deleteOnlineEvaluator(
    @Request() request: JawnAuthenticatedRequest,
    @Path() evaluatorId: string,
    @Path() onlineEvaluatorId: string
  ): Promise<Result<null, string>> {
    const onlineEvalStore = new OnlineEvalStore(
      request.authParams.organizationId
    );
    const result = await onlineEvalStore.deleteOnlineEvaluator(
      onlineEvaluatorId
    );
    if (result.error) {
      this.setStatus(500);
      return err(result.error || "Failed to delete online evaluator");
    } else {
      this.setStatus(204);
      return ok(null);
    }
  }

  @Post("/python/test")
  public async testPythonEvaluator(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    requestBody: {
      code: string;
      testInput: TestInput;
    }
  ): Promise<
    Result<
      {
        output: string;
        traces: string[];
        statusCode?: number;
      },
      string
    >
  > {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.testPythonEvaluator({
      code: requestBody.code,
      requestBodyString: requestBody.testInput.inputBody,
      responseString: requestBody.testInput.outputBody,
    });
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error || "Failed to test python evaluator");
    } else {
      this.setStatus(200);
      return ok(result.data);
    }
  }

  @Post("/llm/test")
  public async testLLMEvaluator(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    requestBody: {
      evaluatorConfig: EvaluatorConfig;
      testInput: TestInput;
      evaluatorName: string;
    }
  ): Promise<EvaluatorScoreResult> {
    const llmAsAJudge = new LLMAsAJudge({
      scoringType: requestBody.evaluatorConfig.evaluator_scoring_type as
        | "LLM-CHOICE"
        | "LLM-BOOLEAN"
        | "LLM-RANGE",
      llmTemplate: JSON.parse(
        requestBody.evaluatorConfig.evaluator_llm_template ?? "{}"
      ),
      inputRecord: requestBody.testInput.inputs,
      outputBody: requestBody.testInput.outputBody,
      inputBody: requestBody.testInput.inputBody,
      promptTemplate: requestBody.testInput.promptTemplate ?? "",
      evaluatorName: requestBody.evaluatorName,
      organizationId: request.authParams.organizationId,
    });
    const result = await llmAsAJudge.evaluate();
    if (result.error) {
      this.setStatus(500);
    }
    return result;
  }

  @Post("/lastmile/test")
  public async testLastMileEvaluator(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    requestBody: {
      config: LastMileConfigForm;
      testInput: TestInput;
    }
  ): Promise<
    Result<
      {
        score: number;
        input: string;
        output: string;
        ground_truth?: string;
      },
      string
    >
  > {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.testLastMileEvaluator(requestBody);
    if (result.error) {
      this.setStatus(500);
      return err(result.error || "Failed to test last mile evaluator");
    } else {
      this.setStatus(200);
      return ok(result.data!);
    }
  }

  @Get("{evaluatorId}/stats")
  public async getEvaluatorStats(
    @Request() request: JawnAuthenticatedRequest,
    @Path() evaluatorId: string
  ): Promise<Result<EvaluatorStats, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.getEvaluatorStats(evaluatorId);

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }
}
