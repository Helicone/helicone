// src/users/usersController.ts
import {
  Body,
  Controller,
  Delete,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result } from "../../lib/shared/result";
import {
  FilterLeafSubset,
  FilterNode,
} from "../../lib/shared/filters/filterDefs";
import { PromptManager } from "../../managers/prompt/PromptManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { InputsManager } from "../../managers/inputs/InputsManager";

export type PromptsFilterBranch = {
  left: PromptsFilterNode;
  operator: "or" | "and";
  right: PromptsFilterNode;
};
type PromptsFilterNode =
  | FilterLeafSubset<"prompt_v2">
  | PromptsFilterBranch
  | "all";

export interface PromptsQueryParams {
  filter: PromptsFilterNode;
}

export interface PromptsResult {
  id: string;
  user_defined_id: string;
  description: string;
  pretty_name: string;
  created_at: string;
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

export interface PromptInputRecord {
  id: string;
  inputs: Record<string, string>;
  source_request: string;
  prompt_version: string;
  created_at: string;
  response_body: string;
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
