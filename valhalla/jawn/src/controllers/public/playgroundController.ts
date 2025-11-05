import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result, err } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { type OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import OpenAI from "openai";
import { generateTempHeliconeAPIKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { PlaygroundManager } from "../../managers/playgroundManager";
import { ChatCompletionService } from "../../lib/services/chatCompletionService";

@Route("v1/playground")
@Tags("Playground")
@Security("api_key")
export class PlaygroundController extends Controller {
  @Post("/generate")
  public async generate(
    @Body()
    bodyParams: OpenAIChatRequest & {
      useAIGateway?: boolean;
      logRequest?: boolean;
    },
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<
    Result<
      | OpenAI.Chat.Completions.ChatCompletion
      | { content: string; reasoning: string; calls: any },
      string
    >
  > {
    try {
      const { useAIGateway, logRequest, ...prompt } = bodyParams;

      const isLocalDev =
        process.env.NODE_ENV === "development" ||
        process.env.VERCEL_ENV === "development";

      const aiGatewayBaseURL = isLocalDev
        ? "http://localhost:8793/v1"
        : "https://ai-gateway.helicone.ai/v1";

      try {
        const tempKey = await generateTempHeliconeAPIKey(
          request.authParams.organizationId,
        );
        if (tempKey.error || !tempKey.data) {
          console.error("[API] Failed to generate temp key:", tempKey.error);
          this.setStatus(400);
          return err(
            tempKey.error ||
              "Failed to generate API key. Please try again later.",
          );
        }

        const service = new ChatCompletionService();
        const result = await tempKey.data.with<
          Result<
            | OpenAI.Chat.Completions.ChatCompletion
            | { content: string; reasoning: string; calls: any },
            string
          >
        >((secretKey) =>
          service.send(request, prompt, {
            baseURL: aiGatewayBaseURL,
            apiKey: secretKey,
            defaultHeaders: {
              "Helicone-User-Id": "helicone_playground",
              "Helicone-Property-Playground_User_ID":
                request.authParams.userId || "Unknown",
            },
          }),
        );

        if (result.error) {
          // Attempt to propagate status code to response
          const statusMatch = result.error.match(/^\[(\d+)\]/);
          if (statusMatch) {
            const status = parseInt(statusMatch[1], 10);
            this.setStatus(status >= 400 && status < 500 ? 400 : 500);
          } else {
            this.setStatus(500);
          }
        }

        return result;
      } catch (e) {
        console.error("[API] Exception creating user client:", e);
        this.setStatus(500);
        return err("Unknown error occurred. Please try again later.");
      }
    } catch (error) {
      this.setStatus(500);
      return err("Failed to generate response: " + JSON.stringify(error));
    }
  }

  @Post("/requests-through-helicone")
  public async requestsThroughHelicone(
    @Body() params: { requestsThroughHelicone: boolean },
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<string, string>> {
    const playgroundManager = new PlaygroundManager(request.authParams);
    return playgroundManager.setPlaygroundRequestsThroughHelicone(
      request.authParams.organizationId,
      params.requestsThroughHelicone,
    );
  }

  @Get("/requests-through-helicone")
  public async getRequestsThroughHelicone(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<boolean, string>> {
    const playgroundManager = new PlaygroundManager(request.authParams);
    return playgroundManager.getRequestsThroughHelicone(
      request.authParams.organizationId,
    );
  }
}
