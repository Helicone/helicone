import { getUsageProcessor } from "@helicone-package/cost/usage/getUsageProcessor";
import { mapModelUsageToOpenAI } from "@helicone-package/cost/usage/mapModelUsageToOpenAI";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { OpenAIResponseBody, ChatCompletionChunk } from "../types/openai";

export async function toOpenAIResponse(
  response: Response,
  provider: ModelProviderName,
  providerModelId: string,
  isStream: boolean = false
): Promise<Response> {
  try {
    // Step 1: Parse response body (already in OpenAI format)
    const providerResponse = await response.text();
    const openAIBody: OpenAIResponseBody = JSON.parse(providerResponse);

    // Step 2: Normalize usage for ALL providers
    const usageProcessor = getUsageProcessor(provider);
    if (usageProcessor) {
      const modelUsageResult = await usageProcessor.parse({
        responseBody: providerResponse,
        isStream,
        model: providerModelId,
      });

      if (modelUsageResult.data) {
        // Map normalized ModelUsage to OpenAI format and replace in response
        openAIBody.usage = mapModelUsageToOpenAI(modelUsageResult.data);
      }
    }

    // Step 3: Return new response with normalized body
    return new Response(JSON.stringify(openAIBody), {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "content-type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to normalize response usage:", error);
    // Return original response if normalization fails
    return response;
  }
}

export function toOpenAIStreamResponse(
  response: Response,
  provider: ModelProviderName,
  providerModelId: string
): Response {
  if (!response.body) {
    return response;
  }

  const transformedStream = normalizeOpenAIStream(
    response.body,
    provider,
    providerModelId
  );

  return new Response(transformedStream, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
      connection: "keep-alive",
      ...Object.fromEntries(response.headers.entries()),
    },
  });
}

/**
 * Normalizes usage in OpenAI-formatted streaming responses.
 *
 * Processes OpenAI SSE streams and normalizes usage fields in chunks
 * that contain usage data using provider-specific usage processors.
 */
export class OpenAIStreamUsageNormalizer {
  private provider: ModelProviderName;
  private providerModelId: string;
  private accumulatedChunks: string[] = [];

  constructor(provider: ModelProviderName, providerModelId: string) {
    this.provider = provider;
    this.providerModelId = providerModelId;
  }

  async processLines(
    raw: string,
    onChunk: (chunk: ChatCompletionChunk) => void
  ): Promise<void> {
    const lines = raw.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const jsonStr = line.slice(6);

          // Skip the [DONE] message
          if (jsonStr.trim() === "[DONE]") {
            continue;
          }

          const chunk: ChatCompletionChunk = JSON.parse(jsonStr);

          // Accumulate all chunks for usage parsing
          this.accumulatedChunks.push(jsonStr);

          // If this chunk has usage, normalize it
          if (chunk.usage) {
            const usageProcessor = getUsageProcessor(this.provider);
            if (usageProcessor) {
              // Reconstruct full response text from accumulated chunks
              const fullResponseText = this.accumulatedChunks
                .map((c) => `data: ${c}\n\n`)
                .join("");

              const modelUsageResult = await usageProcessor.parse({
                responseBody: fullResponseText,
                isStream: true,
                model: this.providerModelId,
              });

              if (modelUsageResult.data) {
                chunk.usage = mapModelUsageToOpenAI(modelUsageResult.data);
              }
            }
          }

          onChunk(chunk);
        } catch (error) {
          console.error("Failed to parse SSE data:", error);
        }
      } else if (line.startsWith("event:") || line.startsWith(":")) {
        // Skip event type lines and comments
        continue;
      }
    }
  }
}

/**
 * Transforms an OpenAI SSE stream to normalize usage in chunks.
 */
function normalizeOpenAIStream(
  stream: ReadableStream<Uint8Array>,
  provider: ModelProviderName,
  providerModelId: string
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const normalizer = new OpenAIStreamUsageNormalizer(provider, providerModelId);
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (buffer.trim()) {
              await processBuffer(buffer, controller, encoder, normalizer);
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const messages = buffer.split("\n\n");

          buffer = messages.pop() || "";

          for (const message of messages) {
            if (message.trim()) {
              await processBuffer(
                message + "\n\n",
                controller,
                encoder,
                normalizer
              );
            }
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

async function processBuffer(
  buffer: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  normalizer: OpenAIStreamUsageNormalizer
) {
  await normalizer.processLines(buffer, (chunk) => {
    const sseMessage = `data: ${JSON.stringify(chunk)}\n\n`;
    controller.enqueue(encoder.encode(sseMessage));
  });
}
