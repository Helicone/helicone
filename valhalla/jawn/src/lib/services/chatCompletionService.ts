import OpenAI from "openai";
import { Result, ok, err } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";

export interface SendOptions {
  baseURL: string;
  apiKey: string;
  defaultHeaders?: Record<string, string>;
}

export class ChatCompletionService {
  private buildClient(opts: SendOptions) {
    const { baseURL, apiKey, defaultHeaders } = opts;
    return new OpenAI({
      baseURL,
      apiKey,
      defaultHeaders: defaultHeaders ?? {},
    });
  }

  public async send(
    request: JawnAuthenticatedRequest,
    body: OpenAIChatRequest,
    opts: SendOptions,
  ): Promise<
    Result<
      | OpenAI.Chat.Completions.ChatCompletion
      | { content: string; reasoning: string; calls: any },
      string
    >
  > {
    const client = this.buildClient(opts);
    const abortController = new AbortController();

    try {
      const isStreaming = Boolean(body.stream);
      const response = await client.chat.completions.create(
        {
          model: body.model,
          messages: body.messages,
          temperature: body.temperature,
          max_tokens: body.max_tokens,
          top_p: body.top_p,
          frequency_penalty: body.frequency_penalty,
          presence_penalty: body.presence_penalty,
          stop: body.stop,
          stream: isStreaming,
          response_format: body.response_format,
          tools: body.tools,
          reasoning_effort: body.reasoning_effort,
          verbosity: body.verbosity,
        } as any,
        {
          signal: abortController.signal,
        },
      );

      if (isStreaming) {
        (<any>request.res).setHeader("Content-Type", "text/event-stream");
        (<any>request.res).setHeader("Cache-Control", "no-cache");
        (<any>request.res).setHeader("Connection", "keep-alive");

        const stream =
          response as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
        try {
          for await (const chunk of stream) {
            if (request.headers["x-cancel"] === "1") {
              abortController.abort();
              return ok({ content: "", reasoning: "", calls: "" });
            }

            if (typeof chunk === "string" && chunk === "[DONE]") {
              continue;
            }

            const chunkString = JSON.stringify(chunk);
            const sseFormattedChunk = `data: ${chunkString}\n\n`;
            (<any>request.res).write(sseFormattedChunk);
            // @ts-ignore
            request.res.flush?.();
          }
        } catch (error) {
          console.error("[ChatCompletionService] Stream error:", error);
          if (
            error instanceof Error &&
            (error.name === "ResponseAborted" || error.name === "AbortError")
          ) {
            // ignore
          } else {
            (<any>request.res).end();
            throw error;
          }
        } finally {
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
          "[ChatCompletionService] LLM call returned empty content and no tool calls.",
        );
      }

      return ok({ content, reasoning, calls });
    } catch (error) {
      console.error("[ChatCompletionService] Error:", error);
      if (error instanceof OpenAI.APIError) {
        const statusCode = error.status || 0;
        return err(`[${statusCode}] ${error.message || "API Error occurred"}`);
      }
      if (error instanceof Error) {
        return err(error.message);
      }
      return err("Unknown error occurred");
    }
  }
}
