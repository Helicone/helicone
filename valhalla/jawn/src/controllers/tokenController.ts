// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { hashAuth } from "../lib/db/hash";
import { supabaseServer } from "../lib/routers/withAuth";
import { JawnAuthenticatedRequest } from "../types/request";
import { FineTuningManager } from "../managers/FineTuningManager";
import {
  FineTuningJob,
  FineTuningJobEventsPage,
} from "openai/resources/fine-tuning/jobs";
import { FilterNode } from "../lib/shared/filters/filterDefs";
import { getRequests } from "../lib/stores/request/request";
import * as Sentry from "@sentry/node";
import { postHogClient } from "../lib/clients/postHogClient";
import {
  getTokenCountAnthropic,
  getTokenCountGPT3,
} from "../lib/tokens/tokenCounter";

export interface TokenBodyParams {
  content: string;
}

export interface TokenResponseBody {
  tokens: number;
}
@Route("v1/tokens")
@Tags("TokenCounter")
@Security("api_key")
export class TokenController extends Controller {
  @Post("anthropic")
  public async anthropicTokenCount(
    @Body()
    body: TokenBodyParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<TokenResponseBody> {
    const { content } = body;
    const tokens = await getTokenCountAnthropic(content ?? "");
    return { tokens };
  }
  @Post("gpt3")
  public async gpt3TokenCount(
    @Body()
    body: TokenBodyParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<TokenResponseBody> {
    const { content } = body;
    const tokens = await getTokenCountGPT3(content ?? "");
    return { tokens };
  }
}
