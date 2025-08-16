import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { Result, err, ok } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { type OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import OpenAI from "openai";
import { getHeliconeDefaultTempKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { ENVIRONMENT } from "../../lib/clients/constant";

@Route("v1/agent")
@Tags("Agent")
@Security("api_key")
export class AgentController extends Controller {
  @Post("/generate")
  public async generate(
    @Body()
    bodyParams: OpenAIChatRequest & {
      useAIGateway?: boolean; // ignored
      logRequest?: boolean; // ignored
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      | OpenAI.Chat.Completions.ChatCompletion
      | { content: string; reasoning: string; calls: any },
      string
    >
  > {
    try {
      // Extract and ignore useAIGateway and logRequest for agent endpoint
      // Done so its the exact interface as v1/playground/generate
      const { useAIGateway, logRequest, ...params } = bodyParams;

      const tempKey = await getHeliconeDefaultTempKey(
        request.authParams.organizationId
      );

      if (tempKey.error || !tempKey.data) {
        throw new Error(
          tempKey.error || "Failed to generate temporary API key"
        );
      }

      return tempKey.data.with<
        Result<
          | OpenAI.Chat.Completions.ChatCompletion
          | { content: string; reasoning: string; calls: any },
          string
        >
      >(async (secretKey) => {
        const openai = new OpenAI({
          // baseURL: `http://localhost:8793/v1/`,
          baseURL: `https://ai-gateway.helicone.ai/v1/`,
          apiKey: secretKey,
          defaultHeaders: {
            "Helicone-Property-Environment": ENVIRONMENT,
            "Helicone-Property-OrganizationId":
              request.authParams.organizationId,
            "Helicone-User-Id": request.authParams.userId,
            "Helicone-Property-Is-Agent": "true",
          },
        });
        const abortController = new AbortController();

        try {
          const response = await openai.chat.completions.create(
            {
              model: params.model,
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
              reasoning_effort: params.reasoning_effort,
              verbosity: params.verbosity,
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
              console.error("[Agent API Stream] Stream error:", error); // Log the error
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
              "[Agent API] LLM call resulted in empty content and no tool calls."
            );
          }

          return ok({ content, reasoning, calls });
        } catch (error) {
          console.error("[Agent API] Inner try-catch error:", error);
          this.setStatus(500);
          if (error instanceof Error) {
            if (
              error.name === "ResponseAborted" ||
              error.name === "AbortError"
            ) {
              this.setStatus(400);
              return err("Request cancelled");
            }

            if (error instanceof OpenAI.APIError) {
              this.setStatus(400);
              return err(error.error.message);
            }
            this.setStatus(500);
            return err(error.message);
          }

          this.setStatus(500);
          return err("Failed to generate response");
        }
      });
    } catch (error) {
      this.setStatus(500);
      return err("Failed to generate response");
    }
  }
}
