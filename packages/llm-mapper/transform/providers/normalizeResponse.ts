import { getUsageProcessor } from "@helicone-package/cost/usage/getUsageProcessor";
import { mapModelUsageToOpenAI } from "@helicone-package/cost/usage/mapModelUsageToOpenAI";
import { ModelProviderName } from "@helicone-package/cost/models/providers";
import { ResponseFormat } from "@helicone-package/cost/models/types";
import { OpenAIResponseBody, ChatCompletionChunk } from "../types/openai";
import { toOpenAI } from "./anthropic/response/toOpenai";
import { AnthropicToOpenAIStreamConverter } from "./anthropic/streamedResponse/toOpenai";

function decodeBase64(base64: string): string {
  if (typeof atob === "function") {
    return atob(base64);
  }

  const bufferCtor = (globalThis as { Buffer?: any }).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(base64, "base64").toString("utf-8");
  }

  throw new Error("Base64 decoding is not supported in this environment.");
}

function isBedrockEventStreamResponse(text: string): boolean {
  return (
    text.includes(":event-type") ||
    text.includes(":message-type") ||
    text.includes('{"bytes"')
  );
}

function extractBedrockEventPayloads(text: string): Array<{ bytes?: string }> {
  const payloads: Array<{ bytes?: string }> = [];
  let index = 0;

  while (index < text.length) {
    const start = text.indexOf('{"bytes"', index);
    if (start === -1) {
      break;
    }

    let braceCount = 0;
    let end = start;
    let parsed: { bytes?: string } | null = null;

    while (end < text.length) {
      const char = text[end];
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0) {
          const candidate = text.slice(start, end + 1);
          try {
            parsed = JSON.parse(candidate);
          } catch (error) {
            // ignore malformed payloads
          }
          break;
        }
      }
      end++;
    }

    if (parsed) {
      payloads.push(parsed);
    }
    index = end + 1;
  }

  return payloads;
}

function serializeOpenAIChunks(
  chunks: ChatCompletionChunk[],
  includeDone: boolean = true
): string {
  const lines = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}`);

  if (includeDone) {
    lines.push("data: [DONE]");
  }

  return lines.join("\n\n") + "\n\n";
}

async function convertBedrockAnthropicStreamToOpenAI(
  responseText: string
): Promise<string> {
  const converter = new AnthropicToOpenAIStreamConverter();
  const openAIChunks: ChatCompletionChunk[] = [];
  const payloads = extractBedrockEventPayloads(responseText);
  // as of 2025-10-16 bedrock does not include 1h cache buckets
  let messageStartUsage:
    | {
        input_tokens?: number;
        cache_creation_input_tokens?: number;
        cache_read_input_tokens?: number;
        output_tokens?: number;
      }
    | null = null;

  for (const payload of payloads) {
    if (!payload?.bytes) {
      continue;
    }

    try {
      const decoded = decodeBase64(payload.bytes);
      let event: any;

      try {
        event = JSON.parse(decoded);
      } catch (error) {
        console.error("Failed to parse Bedrock decoded payload:", error);
        continue;
      }

      if (event?.type === "message_start" && event?.message?.usage) {
        messageStartUsage = {
          input_tokens: event.message.usage.input_tokens,
          cache_creation_input_tokens:
            event.message.usage.cache_creation_input_tokens,
          cache_read_input_tokens: event.message.usage.cache_read_input_tokens,
          output_tokens: event.message.usage.output_tokens,
        };
      }

      if (event?.type === "message_delta") {
        const usage = {
          ...(event.usage ?? {}),
        };

        if (messageStartUsage) {
          if (
            usage.input_tokens === undefined &&
            messageStartUsage.input_tokens !== undefined
          ) {
            usage.input_tokens = messageStartUsage.input_tokens;
          }

          if (
            usage.cache_creation_input_tokens === undefined &&
            messageStartUsage.cache_creation_input_tokens !== undefined
          ) {
            usage.cache_creation_input_tokens =
              messageStartUsage.cache_creation_input_tokens;
          }

          if (
            usage.cache_read_input_tokens === undefined &&
            messageStartUsage.cache_read_input_tokens !== undefined
          ) {
            usage.cache_read_input_tokens =
              messageStartUsage.cache_read_input_tokens;
          }

          if (
            usage.output_tokens === undefined &&
            messageStartUsage.output_tokens !== undefined
          ) {
            usage.output_tokens = messageStartUsage.output_tokens;
          }
        }

        if (Object.keys(usage).length > 0) {
          event.usage = usage;
        }
      }

      const anthropicSSE = `data: ${JSON.stringify(event)}\n\n`;
      converter.processLines(anthropicSSE, (chunk) => {
        openAIChunks.push(chunk);
      });
    } catch (error) {
      console.error("Failed to decode Bedrock payload:", error);
    }
  }

  if (openAIChunks.length === 0) {
    return "";
  }

  return serializeOpenAIChunks(openAIChunks);
}

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
 * Normalizes usage in OpenAI-formatted SSE text.
 *
 * Takes raw SSE text, normalizes usage fields in chunks, and returns
 * reconstructed SSE text with normalized usage.
 */
export async function normalizeOpenAIStreamText(
  sseText: string,
  provider: ModelProviderName,
  providerModelId: string
): Promise<string> {
  const normalizer = new OpenAIStreamUsageNormalizer(provider, providerModelId);
  const normalizedChunks: any[] = [];

  await normalizer.processLines(sseText, (chunk) => {
    normalizedChunks.push(chunk);
  });

  return serializeOpenAIChunks(normalizedChunks);
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

/**
 * Normalizes AI Gateway responses to OpenAI format with correct usage.
 *
 * Handles both streaming and non-streaming responses, converting from
 * provider-native format to OpenAI format when needed, and normalizing
 * usage fields for all providers.
 */
export async function normalizeAIGatewayResponse(params: {
  responseText: string;
  isStream: boolean;
  provider: ModelProviderName;
  providerModelId: string;
  responseFormat: ResponseFormat;
}): Promise<string> {
  const { responseText, isStream, provider, providerModelId, responseFormat } =
    params;

  try {
    if (isStream) {
      // Streaming responses
      if (responseFormat === "ANTHROPIC") {
        if (isBedrockEventStreamResponse(responseText)) {
          const normalized =
            await convertBedrockAnthropicStreamToOpenAI(responseText);
          if (normalized) {
            return normalized;
          }
        }

        const converter = new AnthropicToOpenAIStreamConverter();
        const openAIChunks: ChatCompletionChunk[] = [];

        converter.processLines(responseText, (chunk) => {
          openAIChunks.push(chunk);
        });

        return serializeOpenAIChunks(openAIChunks);
      }

      if (responseFormat === "OPENAI") {
        // Already in OpenAI format, just normalize usage
        return await normalizeOpenAIStreamText(
          responseText,
          provider,
          providerModelId
        );
      }
    } else {
      // Non-streaming responses
      const providerBody = JSON.parse(responseText);

      let openAIBody = providerBody;
      if (responseFormat === "ANTHROPIC") {
        // Convert Anthropic to OpenAI format
        openAIBody = toOpenAI(providerBody);
      }

      // Normalize usage for all providers
      const usageProcessor = getUsageProcessor(provider);
      if (usageProcessor) {
        const modelUsageResult = await usageProcessor.parse({
          responseBody: responseText,
          isStream: false,
          model: providerModelId,
        });

        if (modelUsageResult.data) {
          openAIBody.usage = mapModelUsageToOpenAI(modelUsageResult.data);
        }
      }

      return JSON.stringify(openAIBody);
    }
  } catch (error) {
    console.error("Failed to normalize AI Gateway response:", error);
    throw error;
  }

  // Fallback: return original response
  return responseText;
}
