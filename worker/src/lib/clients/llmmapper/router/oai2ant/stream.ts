import { AnthropicToOpenAIStreamConverter } from "@helicone-package/llm-mapper/transform/providers/anthropic/streamedResponse/toOpenai";
import { toAnthropic } from "@helicone-package/llm-mapper/transform/providers/openai/request/toAnthropic";
import { HeliconeChatCreateParams } from "@helicone-package/prompts/types";
import { EventStreamCodec } from "@smithy/eventstream-codec";
import { fromUtf8, toUtf8 } from "@smithy/util-utf8";

// transform the readable stream from Anthropic SSE or Bedrock Event Stream to OpenAI SSE format
export function ant2oaiStream(
  stream: ReadableStream<Uint8Array>,
  sourceContentType?: string
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const converter = new AnthropicToOpenAIStreamConverter();

  const isBedrockEventStream =
    sourceContentType?.includes("application/vnd.amazon.eventstream") ?? false;

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();

      try {
        if (isBedrockEventStream) {
          await readBedrockEventStream(reader, controller, encoder, converter, decoder);
        } else {
          await readAnthropicSSE(reader, controller, encoder, converter, decoder);
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

function processBuffer(
  buffer: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  converter: AnthropicToOpenAIStreamConverter
) {
  converter.processLines(buffer, (chunk) => {
    const sseMessage = `data: ${JSON.stringify(chunk)}\n\n`;
    controller.enqueue(encoder.encode(sseMessage));
  });
}

// Anthro SSE Response to OpenAI SSE Response
export function ant2oaiStreamResponse(response: Response): Response {
  if (!response.body) {
    return response;
  }

  const originalContentType = response.headers.get("content-type") ?? undefined;
  const transformedStream = ant2oaiStream(response.body, originalContentType);
  const headers = new Headers(response.headers);

  // change headers to match OpenAI SSE format
  headers.set("content-type", "text/event-stream; charset=utf-8");
  headers.set("cache-control", "no-cache");
  headers.set("connection", "keep-alive");
  headers.delete("content-length");

  return new Response(transformedStream, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function antStream2oaiStream({
  body,
  headers,
}: {
  body: HeliconeChatCreateParams;
  headers: Headers;
}): Promise<Response> {
  const anthropicBody = toAnthropic(body);

  let auth = headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    auth = auth.split(" ")[1];
  }

  const anthropicVersion = headers.get("anthropic-version") || "2023-06-01";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      body: JSON.stringify(anthropicBody),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": auth ?? "",
        "anthropic-version": anthropicVersion,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Anthropic API error:", errorBody);
      return new Response(errorBody, {
        status: response.status,
        headers: response.headers,
      });
    }

    if (!response.body) {
      console.error("No response body from Anthropic API");
      return new Response("No response body", { status: 500 });
    }

    return ant2oaiStreamResponse(response);
  } catch (error) {
    console.error("Error in oaiStream2antStream:", error);
    return new Response(
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      {
        status: 500,
      }
    );
  }
}

// 4 bytes length, 4 bytes header, 4 prelude CRC, 4 CRC
const MINIMUM_EVENT_STREAM_MESSAGE_LENGTH = 16;

async function readAnthropicSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  converter: AnthropicToOpenAIStreamConverter,
  decoder: TextDecoder
): Promise<void> {
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      buffer += decoder.decode();
      if (buffer.trim()) {
        processBuffer(`${buffer}\n\n`, controller, encoder, converter);
      }
      break;
    }

    if (!value) {
      continue;
    }

    buffer += decoder.decode(value, { stream: true });
    const messages = buffer.split("\n\n");
    buffer = messages.pop() ?? "";

    for (const message of messages) {
      if (message.trim()) {
        processBuffer(`${message}\n\n`, controller, encoder, converter);
      }
    }
  }
}

async function readBedrockEventStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  converter: AnthropicToOpenAIStreamConverter,
  decoder: TextDecoder
): Promise<void> {
  const codec = new EventStreamCodec(toUtf8, fromUtf8);
  let buffer = new Uint8Array(0);

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value || value.byteLength === 0) {
      continue;
    }

    if (buffer.byteLength === 0) {
      const initial = new Uint8Array(value.byteLength);
      initial.set(value);
      buffer = initial;
    } else {
      const next = new Uint8Array(buffer.byteLength + value.byteLength);
      next.set(buffer, 0);
      next.set(value, buffer.byteLength);
      buffer = next;
    }

    while (buffer.byteLength >= MINIMUM_EVENT_STREAM_MESSAGE_LENGTH) {
      const view = new DataView(
        buffer.buffer,
        buffer.byteOffset,
        buffer.byteLength
      );
      const messageLength = view.getUint32(0, false);

      if (messageLength < MINIMUM_EVENT_STREAM_MESSAGE_LENGTH) {
        throw new Error(
          `Invalid Bedrock event stream message length: ${messageLength}`
        );
      }

      if (buffer.byteLength < messageLength) {
        break;
      }

      const messageBytes = buffer.slice(0, messageLength);
      buffer = buffer.slice(messageLength);

      const { headers, body } = codec.decode(messageBytes);
      const eventTypeHeader = headers[":event-type"];
      const eventType =
        eventTypeHeader && eventTypeHeader.type === "string"
          ? eventTypeHeader.value
          : undefined;

      if (eventType === "error") {
        const errorPayload = decoder.decode(body);
        throw new Error(
          `Bedrock streaming error${
            errorPayload ? `: ${errorPayload}` : ""
          }`.trim()
        );
      }

      if (eventType !== "chunk") {
        continue;
      }

      if (!body.byteLength) {
        continue;
      }

      let payload: { bytes?: string } | null = null;

      try {
        payload = JSON.parse(decoder.decode(body));
      } catch (error) {
        console.error("Failed to parse Bedrock chunk payload:", error);
        continue;
      }

      if (!payload?.bytes) {
        continue;
      }

      const decodedChunk = decodeBase64ToString(payload.bytes);
      processBuffer(`data: ${decodedChunk}\n\n`, controller, encoder, converter);
    }
  }

  if (buffer.byteLength > 0) {
    throw new Error("Incomplete Bedrock event stream message received.");
  }
}

function decodeBase64ToString(base64: string): string {
  if (typeof atob === "function") {
    const binary = atob(base64);
    const length = binary.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  const bufferCtor = (globalThis as { Buffer?: any }).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(base64, "base64").toString("utf-8");
  }

  throw new Error("Unable to decode base64 payload in current environment.");
}
