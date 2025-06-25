// src/users/usersController.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result } from "../../packages/common/result";
import { Prompt2025Manager } from "../../managers/prompt/PromptManager";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { type OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";

export interface Prompt2025Version {
  id: string;
  model: string;
  prompt_id: string;
  major_version: number;
  minor_version: number;
  commit_message: string;

  created_at: string;

  // TODO: add another type for the user that created
  // it and union with this one for the info.
}

export interface Prompt2025 {
  id: string;
  name: string;
  tags: string[];
  created_at: string;
}

export interface PromptCreateResponse {
  id: string;
}

export interface PromptVersionCounts {
  totalVersions: number;
  majorVersions: number;
}


// TODO: Delete old promptController and rename this to promptController
@Route("v1/prompt-2025")
@Tags("Prompt2025")
@Security("api_key")
export class Prompt2025Controller extends Controller {
  @Post("create")
  public async createPrompt2025(
    @Body()
    requestBody: {
      name: string;
      tags: string[];
      promptBody: OpenAIChatRequest;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<PromptCreateResponse, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);

    const result = await promptManager.createPrompt(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(201); // set return status 201
    }
    return result;
  }

  @Post("query")
  public async getPrompts2025(
    @Body()
    requestBody: {
      search: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Prompt2025[], string>> {
    const promptManager = new Prompt2025Manager(request.authParams);

    const result = await promptManager.getPrompts(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200); // set return status 201
    }
    return result;
  }

  @Post("query/versions")
  public async getPrompt2025Versions(
    @Body()
    requestBody: {
      promptId: string;
      page: number;
      pageSize: number;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Prompt2025Version[], string>> {
    const promptManager = new Prompt2025Manager(request.authParams);

    const result = await promptManager.getPromptVersions(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("query/production-version")
  public async getPrompt2025ProductionVersion(
    @Body()
    requestBody: {
      promptId: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<Prompt2025Version, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);
    const result = await promptManager.getPromptProductionVersion(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }

  @Post("query/total-versions")
  public async getPrompt2025TotalVersions(
    @Body()
    requestBody: {
      promptId: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<PromptVersionCounts, string>> {
    const promptManager = new Prompt2025Manager(request.authParams);

    const result = await promptManager.getPromptVersionCounts(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }
    return result;
  }
}