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
import { ENVIRONMENT, GET_KEY } from "../../lib/clients/constant";
import {
  HeliconeChatCreateParams,
  HeliconeChatCreateParamsStreaming,
} from "@helicone-package/prompts/types";
import {
  InAppThreadsManager,
  InAppThread,
  ThreadSummary,
} from "../../managers/InAppThreadsManager";

/**
 * Models the dashboard's Helix agent may request (see web
 * components/templates/agent/ChatInterface.tsx). The endpoint spends
 * Helicone's own credits, so anything else is rejected.
 */
export const AGENT_ALLOWED_MODELS = new Set([
  "gpt-5",
  "gpt-5-mini",
  "claude-sonnet-4-5-20250514",
  "gpt-5/openai",
  "gpt-5-mini/openai",
  "claude-sonnet-4-5-20250514/anthropic",
]);
const AGENT_MAX_MODEL_FALLBACKS = 3;
export const AGENT_MAX_TOKENS = 16_384;
const AGENT_INPUT_KEYS = ["page", "model", "date"] as const;
const AGENT_INPUT_MAX_LENGTH = 256;
// Per-organization daily request budget, enforced by the AI gateway.
const AGENT_RATE_LIMIT_POLICY = "300;w=86400;s=OrganizationId";

/** Returns an error message if `model` is not an allowed agent model list. */
export function validateAgentModel(model: unknown): string | null {
  if (typeof model !== "string" || model.trim() === "") {
    return "model is required";
  }
  const candidates = model.split(",").map((m) => m.trim());
  if (
    candidates.length > AGENT_MAX_MODEL_FALLBACKS ||
    candidates.some((m) => !AGENT_ALLOWED_MODELS.has(m))
  ) {
    return "Unsupported model";
  }
  return null;
}

/**
 * Caps a client-supplied max_tokens. Returns undefined when absent, or an
 * error string when invalid.
 */
export function capAgentMaxTokens(
  maxTokens: unknown
): { value: number | undefined } | { error: string } {
  if (maxTokens === undefined || maxTokens === null) {
    return { value: undefined };
  }
  if (
    typeof maxTokens !== "number" ||
    !Number.isInteger(maxTokens) ||
    maxTokens <= 0
  ) {
    return { error: "max_tokens must be a positive integer" };
  }
  return { value: Math.min(maxTokens, AGENT_MAX_TOKENS) };
}

/**
 * Only the template variables the dashboard's Helix prompt uses are passed
 * through, as short strings. Everything else from the client is dropped.
 */
export function sanitizeAgentInputs(
  inputs: unknown
): Record<string, string> | undefined {
  if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const key of AGENT_INPUT_KEYS) {
    const value = (inputs as Record<string, unknown>)[key];
    if (typeof value === "string") {
      out[key] = value.slice(0, AGENT_INPUT_MAX_LENGTH);
    }
  }
  return out;
}

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
    // Only dashboard users (JWT) may spend Helicone's credits on Helix, and the
    // gateway rate limit is keyed on the organization, so fail closed if
    // either identity is missing.
    if (
      request.authParams.authType !== "jwt" ||
      !request.authParams.userId ||
      !request.authParams.organizationId
    ) {
      this.setStatus(403);
      return err("The agent is only available from the Helicone dashboard");
    }

    const modelError = validateAgentModel(bodyParams?.model);
    if (modelError) {
      this.setStatus(400);
      return err(modelError);
    }

    const maxTokens = capAgentMaxTokens(bodyParams?.max_tokens);
    if ("error" in maxTokens) {
      this.setStatus(400);
      return err(maxTokens.error);
    }

    try {
      // Extract and ignore useAIGateway and logRequest for agent endpoint
      // Done so its the exact interface as v1/playground/generate.
      // prompt_id / environment are also ignored: the agent always runs the
      // internal Helix prompt.
      const {
        useAIGateway,
        logRequest,
        prompt_id: _ignoredPromptId,
        environment: _ignoredEnvironment,
        inputs: rawInputs,
        ...params
      } = bodyParams;

      const PROMPT_ID = await GET_KEY("key:helix_prompt_id");
      if (!PROMPT_ID) {
        this.setStatus(503);
        return err("Agent is not configured");
      }

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
            "Helicone-RateLimit-Policy": AGENT_RATE_LIMIT_POLICY,
          },
        });
        const abortController = new AbortController();

        try {
          const body = {
            model: params.model as string,
            messages:
              (params.messages as HeliconeChatCreateParams["messages"]) || [],
            temperature: params.temperature,
            max_tokens: maxTokens.value,
            top_p: params.top_p,
            frequency_penalty: params.frequency_penalty,
            presence_penalty: params.presence_penalty,
            stop: params.stop,
            stream: Boolean(params.stream),
            response_format: params.response_format as any,
            tools: params.tools,
            reasoning_effort: params.reasoning_effort,
            verbosity: params.verbosity,
            stream_options: { include_usage: true },

            // Helicone Prompt Params (server-controlled)
            prompt_id: PROMPT_ID,
            inputs: sanitizeAgentInputs(rawInputs),
          } satisfies
            | HeliconeChatCreateParams
            | HeliconeChatCreateParamsStreaming;

          const response = await openai.chat.completions.create(body as any, {
            signal: abortController.signal,
          });

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
              return err(error.message);
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
      messages: any[];
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

  @Post("/thread/create-and-escalate")
  public async createAndEscalateThread(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<InAppThread, string>> {
    const threadsManager = new InAppThreadsManager(request.authParams);

    const result = await threadsManager.createAndEscalateThread();

    if (result.error) {
      this.setStatus(400);
      return err(result.error);
    }

    return ok(result.data!);
  }

  @Post("/thread/{sessionId}/reopen")
  public async reopenThread(
    @Path() sessionId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<InAppThread, string>> {
    const threadsManager = new InAppThreadsManager(request.authParams);

    const result = await threadsManager.reopenThread(sessionId);

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
    const mcpTool =
      (await GET_KEY("key:mintlify_mcp_tool")) ||
      "SearchHeliconeOssLlmObservability";

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
          method: "tools/call",
          params: {
            name: mcpTool,
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
