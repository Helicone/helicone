// src/users/usersController.ts
import { HeliconeManualLogger } from "@helicone/helpers";
import OpenAI from "openai";
import {
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from "openai/resources/chat/completions";
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { GET_KEY } from "../../lib/clients/constant";
import { generateTempHeliconeAPIKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { ok, Result } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";

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
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<OpenAI.Chat.Completions.ChatCompletion, string>> {
    const heliconeOnHeliconeApiKey = await GET_KEY(
      "key:helicone_on_helicone_key",
    );
    const heliconeLogger = new HeliconeManualLogger({
      apiKey: heliconeOnHeliconeApiKey,
    });
    const openaiKey = await GET_KEY("key:openai");
    if (!openaiKey) {
      this.setStatus(500);
      return {
        error: "No OpenAI key found",
        data: null,
      };
    }

    const tempAPIKey = await generateTempHeliconeAPIKey(
      request.authParams.organizationId,
    );

    if (!tempAPIKey) {
      this.setStatus(500);
      return {
        error: "Failed to generate temporary API key",
        data: null,
      };
    }

    setTimeout(
      () => {
        tempAPIKey.data?.cleanup();
      },
      1000 * 60 * 15,
    );

    // dont include cache seed or enabled if cache is disabled
    const defaultHeaders: Record<string, string> = {};
    if (body.cache_enabled) {
      defaultHeaders["Helicone-Cache-Enabled"] = "true";
      defaultHeaders["Helicone-Cache-Seed"] = request.authParams.userId ?? "";
    }

    const requestId = crypto.randomUUID();

    const result = await tempAPIKey.data?.with(async (apiKey) => {
      const openai = new OpenAI({
        apiKey: openaiKey,
        baseURL:
          process.env.VERCEL_ENV === "production"
            ? "https://oai.helicone.ai/v1"
            : process.env.HELICONE_WORKER_URL
              ? `${process.env.HELICONE_WORKER_URL}/v1`
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
          "Helicone-Request-Id": requestId,
        },
      });

      const requestBody = {
        model: "gpt-4o-mini",
        messages: body.messages,
        tools: body.tools,
        tool_choice: body.tool_choice,
        max_tokens: body.max_tokens ?? 1000,
      } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

      const completion = await openai.chat.completions.create(requestBody);

      // Helicone on Helicone
      await heliconeLogger.logSingleRequest(
        requestBody,
        JSON.stringify(completion),
        {
          additionalHeaders: {
            "Helicone-User-Id": request.authParams.organizationId,
            "Helicone-Property-Location": "demo",
            "Helicone-Property-Remote-Request-Id": requestId,
          },
        },
      );

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
