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
import { Result, resultMap } from "../../lib/shared/result";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { JawnAuthenticatedRequest } from "../../types/request";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { EvaluatorManager } from "../../managers/evaluator/EvaluatorManager";

export interface CreateEvaluatorParams {
  scoring_type: string;
  llm_template: any;
  name: string;
}

export interface UpdateEvaluatorParams {
  scoring_type?: string;
  llm_template?: any;
}

export interface EvaluatorResult {
  id: string;
  created_at: string;
  scoring_type: string;
  llm_template: any;
  organization_id: string;
  updated_at: string;
  name: string;
}

type EvaluatorExperiment = {
  experiment_id: string;
  experiment_created_at: string;
};

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
}
