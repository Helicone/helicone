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
import {
  generateTempHeliconeAPIKey,
  getHeliconeDefaultTempKey,
} from "../../lib/experiment/tempKeys/tempAPIKey";
import { GET_KEY } from "../../lib/clients/constant";
import { dbExecute } from "../../lib/shared/db/dbExecute";
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

const isOnPrem = false;

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
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    Result<
      | OpenAI.Chat.Completions.ChatCompletion
      | { content: string; reasoning: string; calls: any },
      string
    >
  > {
    try {
      const { useAIGateway, ...params } = bodyParams;
      const org = await dbExecute<{
        id: string;
        playground_helicone: boolean;
      }>(`SELECT id, playground_helicone FROM organization WHERE id = $1`, [
        request.authParams.organizationId,
      ]);

      if (useAIGateway) {
        const featureFlags = await dbExecute<{
          id: string;
        }>(
          `SELECT id from feature_flags where org_id = $1 and feature = 'ai_gateway'`,
          [request.authParams.organizationId]
        );
        if (featureFlags.error) {
          return err(`Failed to get feature flags: ${featureFlags.error}`);
        }
        const hasAccessToAIGateway =
          featureFlags.data && featureFlags.data.length > 0;

        if (!hasAccessToAIGateway) {
          this.setStatus(403);
          return err(
            "You do not have access to the AI Gateway. Please contact support to enable this feature."
          );
        }
      }

      if (org.error) {
        return err(`Failed to get organization: ${org.error}`);
      }

      const shouldGenerateTempKey =
        org.data?.[0]?.playground_helicone || bodyParams.logRequest;
      const tempKey =
        !useAIGateway && shouldGenerateTempKey
          ? await generateTempHeliconeAPIKey(request.authParams.organizationId)
          : await getHeliconeDefaultTempKey(request.authParams.organizationId);

      if (tempKey.error || !tempKey.data) {
        throw new Error(
          tempKey.error || "Failed to generate temporary API key"
        );
      }

      const result = await dbExecute<{
        id: string;
        org_id: string;
        decrypted_provider_key: string;
        provider_key_name: string;
        provider_name: string;
      }>(
        `SELECT id, org_id, decrypted_provider_key, provider_key_name, provider_name
         FROM decrypted_provider_keys_v2
         WHERE org_id = $1
         AND soft_delete = false
         AND provider_name = 'OpenRouter'
         LIMIT 1`,
        [request.authParams.organizationId]
      );

      let openRouterKey = await GET_KEY("key:openrouter");
      let selfKey = false;

      if (result?.data?.[0]?.decrypted_provider_key) {
        openRouterKey = result.data?.[0]?.decrypted_provider_key;
        selfKey = true;
      }

      return tempKey.data.with<
        Result<
          | OpenAI.Chat.Completions.ChatCompletion
          | { content: string; reasoning: string; calls: any },
          string
        >
      >(async (secretKey) => {
        const openai = new OpenAI({
          baseURL: `https://openrouter.helicone.ai/api/v1/`,
          apiKey: useAIGateway ? secretKey : openRouterKey,
          defaultHeaders: {
            "Helicone-Auth": `Bearer ${secretKey}`,
            "Helicone-User-Id": request.authParams.organizationId,
            ...(!selfKey && {
              // 30 per month
              "Helicone-RateLimit-Policy": `{30};w={${30 * 24 * 60 * 60}};s=user`,
            }),
          },
        });
        const abortController = new AbortController();

        try {
          const response = await openai.chat.completions.create(
            {
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
              "[API] LLM call resulted in empty content and no tool calls."
            );
          }

          return ok({ content, reasoning, calls });
        } catch (error) {
          console.error("[API] Inner try-catch error:", error);
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
              if (
                error.status === 429 &&
                "helicone-ratelimit-remaining" in error.headers &&
                error.headers["helicone-ratelimit-remaining"] === "0"
              ) {
                this.setStatus(429);
                return err(
                  "You have reached your free playground limit. Please add your own OpenRouter key to continue using the Playground."
                );
              }

              this.setStatus(400);
              if (error.error.metadata?.raw) {
                try {
                  const raw = JSON.parse(error.error.metadata?.raw || "{}");
                  if (raw.error?.message) {
                    return err(raw.error?.message);
                  }
                } catch (err) {}
              }

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

  @Post("/requests-through-helicone")
  public async requestsThroughHelicone(
    @Body() params: { requestsThroughHelicone: boolean },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<string, string>> {
    const playgroundManager = new PlaygroundManager(request.authParams);
    return playgroundManager.setPlaygroundRequestsThroughHelicone(
      request.authParams.organizationId,
      params.requestsThroughHelicone
    );
  }

  @Get("/requests-through-helicone")
  public async getRequestsThroughHelicone(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<boolean, string>> {
    const playgroundManager = new PlaygroundManager(request.authParams);
    return playgroundManager.getRequestsThroughHelicone(
      request.authParams.organizationId
    );
  }
}
