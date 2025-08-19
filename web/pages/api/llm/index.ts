import { dbExecute } from "@/lib/api/db/dbExecute";
import { HandlerWrapperOptions, withAuth } from "@/lib/api/handlerWrappers";
import { GenerateParams } from "@/lib/api/llm-old/generate";
import { getOpenAIKeyFromAdmin } from "@/lib/clients/settings";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { logger } from "@/lib/telemetry/logger";

// Cache for the OpenAI client to avoid recreating it on every request
let openaiClient: OpenAI | null = null;
let isOnPrem = false;

// Function to get or create the OpenAI client
async function getOpenAIClient(
  orgId: string,
  userEmail: string,
): Promise<OpenAI> {
  // Return cached client if available
  if (openaiClient) {
    return openaiClient;
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
    [orgId],
  );

  // Create and cache the client
  openaiClient = new OpenAI({
    baseURL: isOnPrem
      ? "https://oai.helicone.ai/v1/"
      : "https://openrouter.helicone.ai/api/v1/",
    apiKey: process.env.NEXT_PUBLIC_IS_ON_PREM
      ? await getOpenAIKeyFromAdmin()
      : result.data?.[0]?.decrypted_provider_key || "",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.TEST_HELICONE_API_KEY || ""}`,
      "Helicone-User-Id": orgId,
      "Helicone-Property-User-Email": userEmail,
    },
  });

  return openaiClient;
}

// Function to verify request is coming from a browser
function isBrowserRequest(req: any): boolean {
  // Check for common browser headers
  const userAgent = req.headers["user-agent"];
  const acceptHeader = req.headers["accept"];
  const origin = req.headers["origin"];
  const xRequestedWith = req.headers["x-requested-with"];
  const referer = req.headers["referer"];
  const heliconeClient = req.headers["x-helicone-client"];

  // CORS requests from browsers always have Origin header
  const hasOrigin = !!origin;

  // Regular fetch requests typically include application/json in Accept
  const hasAcceptJson =
    acceptHeader && acceptHeader.includes("application/json");

  // Check for the custom header we set in our client code
  const hasClientHeader = heliconeClient === "browser";

  // Check for XHR indicator
  const isXhr = xRequestedWith === "XMLHttpRequest";

  // One of these indicators should be present for browser fetch requests
  return !!(
    userAgent &&
    (hasClientHeader || hasOrigin || hasAcceptJson || isXhr || referer)
  );
}

async function handler({ req, res, userData }: HandlerWrapperOptions<any>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check if the request is coming from a browser
  if (!isBrowserRequest(req)) {
    return res.status(403).json({
      error:
        "Access denied. This endpoint can only be accessed from a browser.",
    });
  }

  if (userData.org?.tier === "FUCK_OFF") {
    const fakeResponse: OpenAI.Chat.Completions.ChatCompletion = {
      id: "fake_id",
      object: "chat.completion",
      model: "gpt-4o-mini",
      created: Date.now(),
      choices: [
        {
          logprobs: null,
          index: 0,
          finish_reason: "stop",
          message: {
            content:
              "Hi, there how can I help you? Are you interested in learning about Helicone?",
            role: "assistant",
            refusal: null,
          },
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
    return res.status(200).json(fakeResponse);
  }

  try {
    // Get or initialize the OpenAI client

    const openai = await getOpenAIClient(userData.orgId, userData.user?.email);

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
      },
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
        logger.error({ error }, "[API Stream] Stream error"); // Log the error
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
      logger.warn(
        "[API] LLM call resulted in empty content and no tool calls.",
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
    logger.error({ error }, "Generation error");
    return res.status(500).json({ error: "Failed to generate response" });
  }
}

export default withAuth(handler);
