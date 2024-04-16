// src/users/usersController.ts
import {
  Body,
  Controller,
  Example,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result } from "../../lib/modules/result";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { SortLeafRequest } from "../../lib/shared/sorts/requests/sorts";
import { HeliconeRequest } from "../../lib/stores/request/request";
import { RequestManager } from "../../managers/request/RequestManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { PromptManager } from "../../managers/prompt/PromptManager";

export interface PromptsQueryParams {}

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

  // @Post("version/{promptVersionId}/query")
  // public async getPromptVersion(
  //   @Body()
  //   requestBody: PromptQueryParams,
  //   @Request() request: JawnAuthenticatedRequest,
  //   @Path() promptVersionId: string
  // ): Promise<Result<PromptVersionResult[], string>> {
  //   const promptManager = new PromptManager(request.authParams);

  //   const result = await promptManager.getPromptVersion({ promptVersionId });
  //   if (result.error || !result.data) {
  //     this.setStatus(500);
  //   } else {
  //     this.setStatus(200); // set return status 201
  //   }
  //   return result;
  // }

  // @Post("{promptId}/experiments/query")
  // public async getPromptExperiments(
  //   @Body()
  //   requestBody: {},
  //   @Request() request: JawnAuthenticatedRequest
  // ): Promise<Result<PromptsResult[], string>> {
  //   const promptManager = new PromptManager(request.authParams);

  //   const result = await promptManager.getPrompt(requestBody);
  //   if (result.error || !result.data) {
  //     this.setStatus(500);
  //   } else {
  //     this.setStatus(200); // set return status 201
  //   }
  //   return result;
  // }
}
