// src/users/usersController.ts
import OpenAI from "openai";
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { generateHeliconeAPIKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { ok, Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from "openai/resources/chat/completions";
import { OPENAI_KEY } from "../../lib/clients/constant";

@Route("v1/demo")
@Tags("Demo")
@Security("api_key")
export class DemoController extends Controller {
  @Post("completion")
  @Tags("Demo")
  public async demoCompletion(
    @Body()
    body: {
      messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
      promptId: string;
      userEmail?: string;
      sessionId?: string;
      sessionName?: string;
      sessionPath?: string;
      tools?: Array<ChatCompletionTool>;
      tool_choice?: ChatCompletionToolChoiceOption;
      max_tokens?: number;
      cache_enabled?: boolean;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<OpenAI.Chat.Completions.ChatCompletion, string>> {
    if (!OPENAI_KEY) {
      this.setStatus(500);
      return {
        error: "No OpenAI key found",
        data: null,
      };
    }

    const tempAPIKey = await generateHeliconeAPIKey(
      request.authParams.organizationId
    );

    if (!tempAPIKey) {
      this.setStatus(500);
      return {
        error: "Failed to generate temporary API key",
        data: null,
      };
    }

    setTimeout(() => {
      tempAPIKey.data?.cleanup();
    }, 1000 * 60 * 15);

    // dont include cache seed or enabled if cache is disabled
    const defaultHeaders: Record<string, string> = {};
    if (body.cache_enabled) {
      defaultHeaders["Helicone-Cache-Enabled"] = "true";
      defaultHeaders["Helicone-Cache-Seed"] = request.authParams.userId ?? "";
    }

    const result = await tempAPIKey.data?.with(async (apiKey) => {
      const openai = new OpenAI({
        apiKey: OPENAI_KEY,
        baseURL:
          process.env.VERCEL_ENV === "production"
            ? "https://oai.helicone.ai/v1"
            : "http://localhost:8787/v1",
        defaultHeaders: {
          ...defaultHeaders,
          "Helicone-Auth": `Bearer ${apiKey}`,
          "Helicone-Rate-Limit":
            "Helicone-RateLimit-Policy: 10;w=10000;u=requests;s=user",
          "Helicone-User-Id": body.userEmail ?? "",
          "Helicone-Prompt-Id": body.promptId,
          "Helicone-Session-Id": body.sessionId ?? "",
          "Helicone-Session-Name": body.sessionName ?? "",
          "Helicone-Session-Path": body.sessionPath ?? "",
        },
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: body.messages,
        tools: body.tools,
        tool_choice: body.tool_choice,
        max_tokens: body.max_tokens ?? 1000,
      });

      return ok(completion);
    });
    if (!result || result.error) {
      this.setStatus(500);
      return {
        error: "Failed to generate temporary API key",
        data: null,
      };
    }

    return ok(result.data!);
  }
}
