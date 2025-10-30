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
import { Result, err, ok } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { Message, Tool } from "@helicone-package/llm-mapper/types";
import { type OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import OpenAI from "openai";
import { generateTempHeliconeAPIKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { PlaygroundManager } from "../../managers/playgroundManager";

export interface GenerateParams {
  provider: any;
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[] | string;
  tools?: Tool[];
  schema?: object;
  signal?: any;
  includeReasoning?: boolean;
  reasoning_effort?: "low" | "medium" | "high";
  response_format?: { type: "json_schema"; json_schema?: object };
  stream?: object;
}

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
      const { ...params } = bodyParams;

      const isLocalDev =
        process.env.NODE_ENV === "development" ||
        process.env.VERCEL_ENV === "development";

      const aiGatewayBaseURL = isLocalDev
        ? "http://localhost:8793/v1"
        : "https://ai-gateway.helicone.ai/v1";

      const buildClient = (key: string) =>
        new OpenAI({
          baseURL: aiGatewayBaseURL,
          apiKey: key,
          defaultHeaders: {
            "Helicone-User-Id": "helicone_playground",
            "Helicone-Property-Playground_User": request.authParams.userId,
          },
        });

      const abortController = new AbortController();

      const send = async (
        client: OpenAI,
        isStreaming: boolean,
      ): Promise<
        Result<
          | OpenAI.Chat.Completions.ChatCompletion
          | { content: string; reasoning: string; calls: any },
          string
        >
      > => {
        try {
          const response = await client.chat.completions.create(
            {
              model: params.model, // Use model ID as-is (e.g., "gpt-4o-mini")
              messages: params.messages,
              temperature: params.temperature,
              max_tokens: params.max_tokens,
              top_p: params.top_p,
              frequency_penalty: params.frequency_penalty,
              presence_penalty: params.presence_penalty,
              stop: params.stop,
              stream: isStreaming,
              response_format: params.response_format,
              tools: params.tools,
              reasoning_effort: params.reasoning_effort,
              verbosity: params.verbosity,
            } as any,
            {
              signal: abortController.signal,
            },
          );

          if (isStreaming) {
            // Set up streaming response
            (<any>request.res).setHeader("Content-Type", "text/event-stream");
            (<any>request.res).setHeader("Cache-Control", "no-cache");
            (<any>request.res).setHeader("Connection", "keep-alive");

            const stream =
              response as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
            try {
              for await (const chunk of stream) {
                // Check if request was cancelled
                if (request.headers["x-cancel"] === "1") {
                  abortController.abort();
                  return ok({ content: "", reasoning: "", calls: "" }); // Exit the loop and function
                }

                // Skip [DONE] message and only send actual chunks
                if (typeof chunk === "string" && chunk === "[DONE]") {
                  continue;
                }

                // Format as Server-Sent Event (SSE)
                const chunkString = JSON.stringify(chunk);
                const sseFormattedChunk = `data: ${chunkString}\n\n`;
                (<any>request.res).write(sseFormattedChunk);

                // @ts-ignore - flush exists on NodeJS.ServerResponse
                request.res.flush?.(); // Ensure chunk is sent immediately
              }
            } catch (error) {
              // Handle stream interruption gracefully
              console.error("[API Stream] Stream error:", error); // Log the error
              if (
                error instanceof Error &&
                (error.name === "ResponseAborted" ||
                  error.name === "AbortError")
              ) {
                // Client likely disconnected or aborted, no need to throw further
              } else {
                // Rethrow other errors to be caught by the outer try-catch
                (<any>request.res).end();
                throw error;
              }
            } finally {
              // Ensure the response is always ended when the stream finishes or aborts/errors
              if (!(<any>request.res).writableEnded) {
                (<any>request.res).end();
              }
            }
            return ok({ content: "", reasoning: "", calls: "" });
          }

          const resp = response as any;
          const content = resp.choices?.[0]?.message?.content || "";
          const reasoning = resp.choices?.[0]?.message?.reasoning || "";
          const calls = resp.choices?.[0]?.message?.tool_calls || "";

          if (!content && !calls) {
            console.warn(
              "[API] LLM call resulted in empty content and no tool calls.",
            );
          }

          return ok({ content, reasoning, calls });
        } catch (error) {
          console.error("[API] Inner try-catch error:", error);
          // Return error instead of throwing to maintain proper type inference
          // Include status code in error message for rate limit detection
          if (error instanceof OpenAI.APIError) {
            const statusCode = error.status || 0;
            return err(
              `[${statusCode}] ${error.message || "API Error occurred"}`,
            );
          }
          if (error instanceof Error) {
            return err(error.message);
          }
          return err("Unknown error occurred");
        }
      };

      // Always use the user's Helicone key (no free admin messages)
      const isStreaming = Boolean(params.stream);
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

        const result = await tempKey.data.with<
          Result<
            | OpenAI.Chat.Completions.ChatCompletion
            | { content: string; reasoning: string; calls: any },
            string
          >
        >(async (secretKey) => {
          const userClient = buildClient(secretKey);
          return await send(userClient, isStreaming);
        });

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
