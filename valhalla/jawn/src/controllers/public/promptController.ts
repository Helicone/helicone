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
import { Result } from "../../lib/modules/result";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { PromptManager } from "../../managers/prompt/PromptManager";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface PromptsQueryParams {
  filter: FilterNode;
}

export interface PromptsResult {
  id: string;
  user_defined_id: string;
  description: string;
  pretty_name: string;
  major_version: number;
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
}

export interface PromptVersionQueryParams {}

export interface PromptVersionResult {
  id: string;
  minor_version: number;
  major_version: number;
  helicone_template: string;
  prompt_v2: string;
  model: string;
}

export interface PromptCreateSubversionParams {
  newHeliconeTemplate: any;
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

  @Post("{promptId}/versions/query")
  public async getPromptVersions(
    @Body()
    requestBody: {},
    @Request() request: JawnAuthenticatedRequest,
    @Path() promptId: string
  ): Promise<Result<PromptVersionResult[], string>> {
    const promptManager = new PromptManager(request.authParams);

    const result = await promptManager.getPromptVersions({
      prompts_versions: {
        prompt_v2: {
          equals: promptId,
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
}
