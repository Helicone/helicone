import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result, err, ok } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { type OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import OpenAI from "openai";
import { getHeliconeDefaultTempKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { ENVIRONMENT } from "../../lib/clients/constant";
import { HeliconeChatCreateParams } from "@helicone-package/prompts/types";
import {
  InAppThreadsManager,
  InAppThread,
  ThreadSummary,
} from "../../managers/InAppThreadsManager";

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
      prompt_id?: string;
      environment?: string;
      inputs?: any;
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

              // Helicone Prompt Params
              prompt_id:
                bodyParams.prompt_id ?? process.env.HELI_AGENT_PROMPT_ID,
              environment: bodyParams.environment,
              inputs: bodyParams.inputs,
            } as HeliconeChatCreateParams,
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

  @Post("/thread/{sessionId}/message")
  public async upsertThreadMessage(
    @Path() sessionId: string,
    @Body()
    bodyParams: {
      messages: OpenAI.Chat.ChatCompletionMessageParam[];
      metadata: {
        posthogSession?: string;
        [key: string]: any;
      };
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<InAppThread, string>> {
    const threadsManager = new InAppThreadsManager(request.authParams);

    const result = await threadsManager.upsertThreadMessage({
      sessionId,
      messages: bodyParams.messages,
      metadata: bodyParams.metadata,
    });

    if (result.error) {
      this.setStatus(400);
      return err(result.error);
    }

    return ok(result.data!);
  }

  @Delete("/thread/{sessionId}")
  public async deleteThread(
    @Path() sessionId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ success: boolean }, string>> {
    const threadsManager = new InAppThreadsManager(request.authParams);

    const result = await threadsManager.deleteThread(sessionId);

    if (result.error) {
      this.setStatus(400);
      return err(result.error);
    }

    return ok({ success: result.data! });
  }

  @Post("/thread/{sessionId}/escalate")
  public async escalateThread(
    @Path() sessionId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<InAppThread, string>> {
    const threadsManager = new InAppThreadsManager(request.authParams);

    const result = await threadsManager.escalateThread(sessionId);

    if (result.error) {
      this.setStatus(400);
      return err(result.error);
    }

    return ok(result.data!);
  }

  @Get("/threads")
  public async getAllThreads(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ThreadSummary[], string>> {
    const threadsManager = new InAppThreadsManager(request.authParams);

    const result = await threadsManager.getAllThreads();

    if (result.error) {
      this.setStatus(400);
      return err(result.error);
    }

    return ok(result.data!);
  }

  @Get("/thread/{sessionId}")
  public async getThread(
    @Path() sessionId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<InAppThread, string>> {
    const threadsManager = new InAppThreadsManager(request.authParams);

    const result = await threadsManager.getThread(sessionId);

    if (result.error) {
      this.setStatus(404);
      return err(result.error);
    }

    return ok(result.data!);
  }

  @Post("/mcp/search")
  public async searchDocs(
    @Body() bodyParams: { query: string },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const { query } = bodyParams;

    try {
      const response = await fetch(`https://docs.helicone.ai/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call", // Fixed: was "tool/call", should be "tools/call"
          params: {
            name: "Search", // Fixed: moved name to correct level
            arguments: {
              query,
            },
          },
        }),
      });

      // Handle SSE response format
      const responseText = await response.text();

      let finalResponse = "";

      // Parse SSE data
      const lines = responseText.trim().split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix
            if (data.result) {
              finalResponse += JSON.stringify(data.result.content, null, 2);
            }

            if (data.error) {
              return err(data.error.message);
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }
      }

      return ok(finalResponse);
    } catch (error) {
      return err("Failed to connect to documentation search service");
    }
  }
}
