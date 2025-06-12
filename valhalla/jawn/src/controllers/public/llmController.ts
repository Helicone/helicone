import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { Result, err, ok } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { Message, Tool } from "@helicone-package/llm-mapper/types";
import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import OpenAI from "openai";
import { generateTempHeliconeAPIKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { GET_KEY } from "../../lib/clients/constant";

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

const isOnPrem = false;

@Route("v1/llm")
@Tags("LLM")
@Security("api_key")
export class LLMController extends Controller {
  @Post("/generate")
  public async generate(
    @Body() params: OpenAIChatRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      | OpenAI.Chat.Completions.ChatCompletion
      | { content: string; reasoning: string; calls: any },
      string
    >
  > {
    try {
      const tempKey = await generateTempHeliconeAPIKey(
        request.authParams.organizationId
      );
      if (tempKey.error || !tempKey.data) {
        throw new Error(
          tempKey.error || "Failed to generate temporary API key"
        );
      }

      const openrouterKey = await GET_KEY("key:openrouter");

      return tempKey.data.with<
        Result<
          | OpenAI.Chat.Completions.ChatCompletion
          | { content: string; reasoning: string; calls: any },
          string
        >
      >(async (secretKey) => {
        console.log("secretKey", secretKey);
        const openai = new OpenAI({
          baseURL: "http://localhost:8789/api/v1/",
          apiKey: openrouterKey,
          defaultHeaders: {
            "Helicone-Auth": `Bearer ${secretKey}`,
            "Helicone-User-Id": request.authParams.organizationId,
            "Helicone-Property-User-Id": request.authParams.userId || "",
          },
        });
        const abortController = new AbortController();

        const response = await openai.chat.completions.create(
          {
            provider: isOnPrem
              ? undefined
              : {
                  sort: "throughput",
                  order: ["Fireworks"],
                },
            model: isOnPrem ? params.model?.split("/")[1] : params.model,
            messages: params.messages,
            temperature: params.temperature,
            max_tokens: params.max_tokens,
            top_p: params.top_p,
            frequency_penalty: params.frequency_penalty,
            presence_penalty: params.presence_penalty,
            stop: params.stop,
            stream: params.stream !== undefined,
            response_format: params.response_format,
            tools: params.tools,
          } as any,
          {
            signal: abortController.signal,
          }
        );

        if (params.stream) {
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
              (error.name === "ResponseAborted" || error.name === "AbortError")
            ) {
              // Client likely disconnected or aborted, no need to throw further
            } else {
              // Rethrow other errors to be caught by the outer try-catch
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
            "[API] LLM call resulted in empty content and no tool calls."
          );
        }

        return ok({ content, reasoning, calls });
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "ResponseAborted" || error.name === "AbortError") {
          return ok({ content: "", reasoning: "", calls: "" });
        }

        if (error instanceof OpenAI.APIError) {
          return err(
            error.error.metadata?.raw
              ? JSON.parse(error.error.metadata?.raw || "{}")?.error?.message
              : error.error.message
          );
        }
      }
      console.error("Generation error:", error);
      return err("Failed to generate response");
    }
  }
}
