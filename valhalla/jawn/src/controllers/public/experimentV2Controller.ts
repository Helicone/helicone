import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  ExperimentV2Manager,
  ScoreV2,
} from "../../managers/experiment/ExperimentV2Manager";
import { Json } from "../../lib/db/database.types";
import {
  PromptCreateSubversionParams,
  PromptVersionResult,
} from "./promptController";
import { EvaluatorManager } from "../../managers/evaluator/EvaluatorManager";
import { EvaluatorResult } from "./evaluatorController";

export interface ExperimentV2 {
  id: string;
  name: string;
  original_prompt_version: string;
  copied_original_prompt_version: string | null;
  input_keys: string[] | null;
  created_at: string;
}

export interface ExperimentV2Output {
  id: string;
  request_id: string;
  is_original: boolean;
  prompt_version_id: string;
  created_at: string;
  input_record_id: string;
}

export interface ExperimentV2PromptVersion {
  created_at: string | null;
  experiment_id: string | null;
  helicone_template: Json | null;
  id: string;
  major_version: number;
  metadata: Json | null;
  minor_version: number;
  model: string | null;
  organization: string;
  prompt_v2: string;
  soft_delete: boolean | null;
}

export interface ExperimentV2Row {
  id: string;
  inputs: Record<string, string>;
  prompt_version: string;
  requests: ExperimentV2Output[];
}

export interface ExtendedExperimentData extends ExperimentV2 {
  rows: ExperimentV2Row[];
  // prompt_versions: ExperimentV2PromptVersion[];
}

export interface CreateNewPromptVersionForExperimentParams
  extends PromptCreateSubversionParams {
  parentPromptVersionId: string;
}

@Route("v2/experiment")
@Tags("Experiment")
@Security("api_key")
export class ExperimentV2Controller extends Controller {
  @Post("/new")
  public async createNewExperiment(
    @Body()
    requestBody: {
      name: string;
      originalPromptVersion: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ experimentId: string }, string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.createNewExperiment(
      requestBody.name,
      requestBody.originalPromptVersion
    );

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Get("/")
  public async getExperiments(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExperimentV2[], string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.getExperiments();

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Get("/{experimentId}")
  public async getExperimentById(
    @Path() experimentId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExtendedExperimentData, string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.getExperimentWithRowsById(
      experimentId
    );
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("/{experimentId}/prompt-version")
  public async createNewPromptVersionForExperiment(
    @Path() experimentId: string,
    @Body() requestBody: CreateNewPromptVersionForExperimentParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<PromptVersionResult, string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.createNewPromptVersionForExperiment(
      experimentId,
      requestBody
    );

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Get("/{experimentId}/prompt-versions")
  public async getPromptVersionsForExperiment(
    @Path() experimentId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ExperimentV2PromptVersion[], string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.getPromptVersionsForExperiment(
      experimentId
    );

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Get("/{experimentId}/input-keys")
  public async getInputKeysForExperiment(
    @Path() experimentId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string[], string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.getInputKeysForExperiment(
      experimentId
    );

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("/{experimentId}/add-manual-row")
  public async addManualRowToExperiment(
    @Path() experimentId: string,
    @Body() requestBody: { inputs: Record<string, string> },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.addManualRowToExperiment(
      experimentId,
      requestBody.inputs
    );

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("/{experimentId}/row/insert/batch")
  public async createExperimentTableRowBatch(
    @Path() experimentId: string,
    @Body()
    requestBody: {
      rows: {
        inputRecordId: string;
        inputs: Record<string, string>;
      }[];
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.createExperimentTableRowBatch(
      experimentId,
      requestBody.rows
    );

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("/{experimentId}/row/update")
  public async updateExperimentTableRow(
    @Path() experimentId: string,
    @Body()
    requestBody: {
      inputRecordId: string;
      inputs: Record<string, string>;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.updateExperimentTableRow(
      experimentId,
      requestBody.inputRecordId,
      requestBody.inputs
    );

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("/{experimentId}/run-hypothesis")
  public async runHypothesis(
    @Path() experimentId: string,
    @Body() requestBody: { promptVersionId: string; inputRecordId: string },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.runHypothesis(
      experimentId,
      requestBody.promptVersionId,
      requestBody.inputRecordId
    );

    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Get("/{experimentId}/evaluators")
  public async getExperimentEvaluators(
    @Path() experimentId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<EvaluatorResult[], string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.getEvaluatorsForExperiment(
      experimentId
    );
    return result;
  }

  @Post("/{experimentId}/evaluators")
  public async createExperimentEvaluator(
    @Path() experimentId: string,
    @Body() requestBody: { evaluatorId: string },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.createExperimentEvaluator(
      experimentId,
      requestBody.evaluatorId
    );
    return result;
  }

  @Delete("/{experimentId}/evaluators/{evaluatorId}")
  public async deleteExperimentEvaluator(
    @Path() experimentId: string,
    @Path() evaluatorId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.deleteExperimentEvaluator(
      experimentId,
      evaluatorId
    );
    return result;
  }

  @Post("/{experimentId}/evaluators/run")
  public async runExperimentEvaluators(
    @Path() experimentId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.runExperimentEvaluators(experimentId);
    return result;
  }

  @Get("/{experimentId}/should-run-evaluators")
  public async shouldRunEvaluators(
    @Path() experimentId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<boolean, string>> {
    const evaluatorManager = new EvaluatorManager(request.authParams);
    const result = await evaluatorManager.shouldRunEvaluators(experimentId);
    return result;
  }

  @Get("/{experimentId}/{promptVersionId}/scores")
  public async getExperimentPromptVersionScores(
    @Path() experimentId: string,
    @Path() promptVersionId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Record<string, ScoreV2>, string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.getExperimentPromptVersionScores(
      experimentId,
      promptVersionId
    );
    return result;
  }

  @Get("/{experimentId}/{requestId}/{scoreKey}")
  public async getExperimentScore(
    @Path() experimentId: string,
    @Path() requestId: string,
    @Path() scoreKey: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ScoreV2 | null, string>> {
    const experimentManager = new ExperimentV2Manager(request.authParams);
    const result = await experimentManager.getExperimentRequestScore(
      experimentId,
      requestId,
      scoreKey
    );
    return result;
  }
}
