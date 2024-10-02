// src/users/usersController.ts
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
import { Result, resultMap } from "../../lib/shared/result";
import {
  FilterLeafSubset,
  FilterNode,
} from "../../lib/shared/filters/filterDefs";
import { PromptManager } from "../../managers/prompt/PromptManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { InputsManager } from "../../managers/inputs/InputsManager";
import { randomUUID } from "crypto";
import { dbExecute } from "../../lib/shared/db/dbExecute";

export type PromptsFilterBranch = {
  left: PromptsFilterNode;
  operator: "or" | "and";
  right: PromptsFilterNode;
};

export type PromptVersionsFilterBranch = {
  left: PromptVersionsFilterNode;
  operator: "or" | "and";
  right: PromptVersionsFilterNode;
};

type PromptsFilterNode =
  | FilterLeafSubset<"prompt_v2">
  | PromptsFilterBranch
  | "all";

type PromptVersionsFilterNode =
  | FilterLeafSubset<"prompts_versions">
  | PromptVersionsFilterBranch
  | "all";

export interface PromptsQueryParams {
  filter: PromptsFilterNode;
}
export interface PromptVersionsQueryParams {
  filter?: PromptVersionsFilterNode;
}

export interface PromptVersiosQueryParamsCompiled
  extends PromptVersionsQueryParams {
  inputs: Record<string, string>;
}

export interface PromptsResult {
  id: string;
  user_defined_id: string;
  description: string;
  pretty_name: string;
  created_at: string;
  major_version: number;
  metadata?: Record<string, any>;
}

export interface PromptQueryParams {
  timeFilter: {
    start: string;
    end: string;
  };
}

export interface PromptResult {
  id: string;
  user_defined_id: string;
  description: string;
  pretty_name: string;
  major_version: number;
  latest_version_id: string;
  latest_model_used: string;
  created_at: string;
  last_used: string;
  versions: string[];
  metadata?: Record<string, any>;
}

export interface PromptVersionQueryParams {}

interface PromptVersionResultBase {
  id: string;
  minor_version: number;
  major_version: number;

  prompt_v2: string;
  model: string;
}

export interface PromptVersionResult extends PromptVersionResultBase {
  helicone_template: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface PromptVersionResultCompiled extends PromptVersionResultBase {
  prompt_compiled: any;
}

export interface PromptVersionResultFilled extends PromptVersionResultBase {
  filled_helicone_template: any;
}

export interface PromptCreateSubversionParams {
  newHeliconeTemplate: any;
  isMajorVersion?: boolean;
  metadata?: Record<string, any>;
}

export interface PromptInputRecord {
  id: string;
  inputs: Record<string, string>;
  dataset_row_id?: string;
  source_request: string;
  prompt_version: string;
  created_at: string;
  response_body?: string;
  request_body?: string;
  auto_prompt_inputs: any[];
}

export interface CreatePromptResponse {
  id: string;
}

@Route("v1/prompt")
@Tags("Prompt")
@Security("api_key")
export class PromptController extends Controller {
  @Post("query")
  public async getPrompts(
    @Body()
    requestBody: PromptsQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<PromptsResult[], string>> {
    const promptManager = new PromptManager(request.authParams);

    const result = await promptManager.getPrompts(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Post("{promptId}/query")
  public async getPrompt(
    @Body()
    requestBody: PromptQueryParams,
    @Request() request: JawnAuthenticatedRequest,
    @Path() promptId: string
  ): Promise<Result<PromptResult, string>> {
    const promptManager = new PromptManager(request.authParams);

    const result = await promptManager.getPrompt(requestBody, promptId);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Delete("{promptId}")
  public async deletePrompt(
    @Request() request: JawnAuthenticatedRequest,
    @Path() promptId: string
  ): Promise<void> {
    const promptManager = new PromptManager(request.authParams);

    const result = await promptManager.deletePrompt({
      promptId,
    });

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
  }

  @Post("create")
  public async createPrompt(
    @Body()
    requestBody: {
      userDefinedId: string;
      prompt: {
        model: string;
        messages: any[];
      };
      metadata: Record<string, any>;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<CreatePromptResponse, string>> {
    const promptManager = new PromptManager(request.authParams);

    const result = await promptManager.createPrompt(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(201); // set return status 201
    }
    return result;
  }

  @Post("version/{promptVersionId}/subversion")
  public async createSubversion(
    @Body()
    requestBody: PromptCreateSubversionParams,
    @Request() request: JawnAuthenticatedRequest,
    @Path() promptVersionId: string
  ): Promise<Result<PromptVersionResult, string>> {
    const promptManager = new PromptManager(request.authParams);

    const result = await promptManager.createNewPromptVersion(
      promptVersionId,
      requestBody
    );
    if (result.error || !result.data) {
      console.log(result.error);
      this.setStatus(500);
    } else {
      this.setStatus(201); // set return status 201
    }
    return result;
  }

  @Post("version/{promptVersionId}/promote")
  public async promotePromptVersionToProduction(
    @Request() request: JawnAuthenticatedRequest,
    @Path() promptVersionId: string,
    @Body()
    requestBody: {
      previousProductionVersionId: string;
    }
  ): Promise<Result<PromptVersionResult, string>> {
    const promptManager = new PromptManager(request.authParams);
    const result = await promptManager.promotePromptVersionToProduction(
      promptVersionId,
      requestBody.previousProductionVersionId
    );
    if (result.error || !result.data) {
      console.log(result.error);
      this.setStatus(500);
    } else {
      this.setStatus(201); // set return status 201
    }
    return result;
  }
  @Post("version/{promptVersionId}/inputs/query")
  public async getInputs(
    @Body()
    requestBody: {
      limit: number;
      random?: boolean;
    },
    @Request() request: JawnAuthenticatedRequest,
    @Path() promptVersionId: string
  ): Promise<Result<PromptInputRecord[], string>> {
    const inputManager = new InputsManager(request.authParams);

    const result = await inputManager.getInputs(
      requestBody.limit,
      promptVersionId,
      requestBody.random
    );
    if (result.error || !result.data) {
      console.log(result.error);
      this.setStatus(500);
    } else {
      this.setStatus(201); // set return status 201
    }
    return result;
  }

  @Get("{promptId}/experiments")
  public async getPromptExperiments(
    @Request() request: JawnAuthenticatedRequest,
    @Path() promptId: string
  ) {
    const result = await dbExecute<{
      id: string;
      created_at: string;
      num_hypotheses: number;
      dataset: string;
      meta: Record<string, any>;
    }>(
      `
      SELECT 
        experiment_v2.id,
        created_at,
        (
          SELECT count(*) from experiment_v2_hypothesis
          WHERE experiment_v2_hypothesis.experiment_v2 = experiment_v2.id
        ) as num_hypotheses,
        dataset,
        meta
        FROM experiment_v2
      WHERE experiment_v2.meta->>'prompt_id' = $1
      AND experiment_v2.organization = $2
      `,
      [promptId, request.authParams.organizationId]
    );
    if (result.error || !result.data) {
      console.error(result.error);
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Post("{promptId}/versions/query")
  public async getPromptVersions(
    @Body()
    requestBody: PromptVersionsQueryParams,
    @Request() request: JawnAuthenticatedRequest,
    @Path() promptId: string
  ): Promise<Result<PromptVersionResult[], string>> {
    const promptManager = new PromptManager(request.authParams);
    const result = await promptManager.getPromptVersions({
      left: requestBody.filter ?? "all",
      operator: "and",
      right: {
        prompt_v2: {
          id: {
            equals: promptId,
          },
        },
      },
    });
    if (result.error || !result.data) {
      console.error(result.error);
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Get("version/{promptVersionId}")
  public async getPromptVersion(
    @Request() request: JawnAuthenticatedRequest,
    @Path() promptVersionId: string
  ): Promise<Result<PromptVersionResult, string>> {
    const promptManager = new PromptManager(request.authParams);
    const result = await promptManager.getPromptVersions({
      prompts_versions: {
        id: {
          equals: promptVersionId,
        },
      },
    });

    if (result.error) {
      console.error(result.error);
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return resultMap(result, (data) => data?.[0]);
  }

  @Delete("version/{promptVersionId}")
  public async deletePromptVersion(
    @Request() request: JawnAuthenticatedRequest,
    @Path() promptVersionId: string
  ): Promise<Result<null, string>> {
    const promptManager = new PromptManager(request.authParams);
    const result = await promptManager.deletePromptVersion(promptVersionId);
    if (result.error) {
      console.error(result.error);
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Post("{user_defined_id}/compile")
  public async getPromptVersionsCompiled(
    @Body()
    requestBody: PromptVersiosQueryParamsCompiled,
    @Request() request: JawnAuthenticatedRequest,
    @Path() user_defined_id: string
  ): Promise<Result<PromptVersionResultCompiled, string>> {
    const promptManager = new PromptManager(request.authParams);
    const result = await promptManager.getCompiledPromptVersions(
      {
        left: requestBody.filter ?? "all",
        operator: "and",
        right: {
          prompt_v2: {
            user_defined_id: {
              equals: user_defined_id,
            },
          },
        },
      },
      requestBody.inputs
    );
    if (result.error || !result.data) {
      console.error(result.error);
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Post("{user_defined_id}/template")
  public async getPromptVersionTemplates(
    @Body()
    requestBody: PromptVersiosQueryParamsCompiled,
    @Request() request: JawnAuthenticatedRequest,
    @Path() user_defined_id: string
  ): Promise<Result<PromptVersionResultFilled, string>> {
    const promptManager = new PromptManager(request.authParams);
    const result = await promptManager.getPormptVersionsTemplates(
      {
        left: requestBody.filter ?? "all",
        operator: "and",
        right: {
          prompt_v2: {
            user_defined_id: {
              equals: user_defined_id,
            },
          },
        },
      },
      requestBody.inputs
    );
    if (result.error || !result.data) {
      console.error(result.error);
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }
}
