// src/users/usersController.ts
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import {
  getTokenCountAnthropic,
  getTokenCountGPT3,
} from "../lib/tokens/tokenCounter";
import { JawnAuthenticatedRequest } from "../types/request";

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
