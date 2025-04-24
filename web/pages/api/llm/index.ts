import { HandlerWrapperOptions, withAuth } from "@/lib/api/handlerWrappers";
import { GenerateParams } from "@/lib/api/llm/generate";
import { getOpenAIKeyFromAdmin } from "@/lib/clients/settings";
import { env } from "next-runtime-env";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";

// Cache for the OpenAI client to avoid recreating it on every request
let openaiClient: OpenAI | null = null;
let isOnPrem = false;

// Function to get or create the OpenAI client
async function getOpenAIClient(orgId: string): Promise<OpenAI> {
  // Return cached client if available
  if (openaiClient) {
    return openaiClient;
  }

  // Get API key from environment or admin settings
  let apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // apiKey = (await getOpenRouterKeyFromAdmin()) || "";
    apiKey = (await getOpenAIKeyFromAdmin()) || "";
    isOnPrem = true;
  }

  // Create and cache the client
  openaiClient = new OpenAI({
    baseURL: isOnPrem
      ? "https://oai.helicone.ai/v1/"
      : "https://openrouter.helicone.ai/api/v1/",
    apiKey: apiKey,
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.TEST_HELICONE_API_KEY || ""}`,
      "Helicone-User-Id": orgId,
      "Helicone-RateLimit-Policy": `1000;w=${24 * 60 * 60};u=request;s=user`, // 1000 requests per day
    },
  });

  return openaiClient;
}

async function handler({ req, res, userData }: HandlerWrapperOptions<any>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get or initialize the OpenAI client
    const openai = await getOpenAIClient(userData.orgId);

    const params = req.body as GenerateParams;
    const abortController = new AbortController();

    const response = await openai.chat.completions.create(
      {
        provider: isOnPrem
          ? undefined
          : {
              sort: "throughput",
              order: ["Fireworks"],
            },
        model: isOnPrem ? params.model.split("/")[1] : params.model,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        top_p: params.topP,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        stop: params.stop,
        stream: params.stream !== undefined,
        response_format: params.response_format,
        reasoning_effort: params.reasoning_effort,
        include_reasoning: params.includeReasoning,
        tools: params.tools,
        ...(params.schema && {
          response_format: zodResponseFormat(params.schema, "result"),
        }),
      } as any,
      {
        signal: abortController.signal,
      }
    );

    if (params.stream) {
      // Set up streaming response
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream =
        response as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

      try {
        for await (const chunk of stream) {
          // Check if request was cancelled
          if (req.headers["x-cancel"] === "1") {
            abortController.abort();
            return; // Exit the loop and function
          }

          // Format as Server-Sent Event (SSE)
          const chunkString = JSON.stringify(chunk);
          const sseFormattedChunk = `data: ${chunkString}\n\n`;
          res.write(sseFormattedChunk);

          // @ts-ignore - flush exists on NodeJS.ServerResponse
          res.flush?.(); // Ensure chunk is sent immediately
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
        if (!res.writableEnded) {
          res.end();
        }
      }
      return; // Ensure we don't fall through to non-streaming logic
    }

    const resp = response as any;
    const content = resp.choices?.[0]?.message?.content || ""; // Default to empty string
    const reasoning = resp.choices?.[0]?.message?.reasoning || ""; // Default to empty string
    const calls = resp.choices?.[0]?.message?.tool_calls || ""; // Default to empty string (or handle actual calls)

    if (!content && !calls) {
      // Check if both content and calls are missing
      // Consider if an empty response should be an error or just empty strings
      console.warn(
        "[API] LLM call resulted in empty content and no tool calls."
      );
      // Returning empty object might be fine depending on requirements
      // throw new Error("Failed to generate response content or tool calls");
    }

    // For non-streaming, always return the full object
    return res.json({ content, reasoning, calls });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "ResponseAborted" || error.name === "AbortError")
    ) {
      return res.json({ content: "" });
    }
    console.error("Generation error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
}

export default withAuth(handler);
