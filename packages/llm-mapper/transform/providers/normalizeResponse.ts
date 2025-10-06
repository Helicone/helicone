import { getUsageProcessor } from "@helicone-package/cost/usage/getUsageProcessor";
import { mapModelUsageToOpenAI } from "@helicone-package/cost/usage/mapModelUsageToOpenAI";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { OpenAIResponseBody } from "../types/openai";

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

/**
 * Normalizes usage in an OpenAI-formatted streaming response.
 *
 * Processes SSE events from the stream and normalizes the usage field
 * in the final chunk using provider-specific usage processors.
 *
 * @param response - The OpenAI-formatted streaming response
 * @param provider - The provider name (e.g., "anthropic", "openai")
 * @param providerModelId - The model ID used by the provider
 * @returns A new streaming response with normalized usage
 */
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
 * Transforms an OpenAI SSE stream to normalize usage in the final chunk.
 */
function normalizeOpenAIStream(
  stream: ReadableStream<Uint8Array>,
  provider: ModelProviderName,
  providerModelId: string
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let fullResponseText = "";

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              controller.enqueue(encoder.encode(buffer));
            }
            controller.close();
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          fullResponseText += chunk;

          // Process complete SSE messages (ending with \n\n)
          const messages = buffer.split("\n\n");
          buffer = messages.pop() || "";

          for (const message of messages) {
            if (!message.trim()) continue;

            // Check if this is a data line with usage
            if (message.includes("data: ") && message.includes('"usage"')) {
              try {
                const dataLine = message
                  .split("\n")
                  .find((line) => line.startsWith("data: "));
                if (dataLine) {
                  const jsonStr = dataLine.slice(6); // Remove "data: " prefix

                  // Skip [DONE] message
                  if (jsonStr.trim() === "[DONE]") {
                    controller.enqueue(encoder.encode(message + "\n\n"));
                    continue;
                  }

                  const chunk = JSON.parse(jsonStr);

                  // If this chunk has usage, normalize it
                  if (chunk.usage) {
                    const usageProcessor = getUsageProcessor(provider);
                    if (usageProcessor) {
                      const modelUsageResult = await usageProcessor.parse({
                        responseBody: fullResponseText,
                        isStream: true,
                        model: providerModelId,
                      });

                      if (modelUsageResult.data) {
                        chunk.usage = mapModelUsageToOpenAI(
                          modelUsageResult.data
                        );
                      }
                    }

                    // Re-emit the normalized chunk
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                    );
                    continue;
                  }
                }
              } catch (error) {
                console.error("Failed to normalize streaming usage:", error);
                // If normalization fails, emit original message
              }
            }

            // Emit the message as-is
            controller.enqueue(encoder.encode(message + "\n\n"));
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
