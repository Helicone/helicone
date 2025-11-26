import { GoogleToOpenAIStreamConverter } from "@helicone-package/llm-mapper/transform/providers/google/streamedResponse/toOpenai";

function processBuffer(
  buffer: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  converter: GoogleToOpenAIStreamConverter
) {
  converter.processLines(buffer, (chunk) => {
    const sseMessage = `data: ${JSON.stringify(chunk)}\n\n`;
    controller.enqueue(encoder.encode(sseMessage));
  });
}

export function goog2oaiStream(
  stream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const converter = new GoogleToOpenAIStreamConverter();

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            buffer += decoder.decode();
            if (buffer.trim()) {
              processBuffer(`${buffer}\n\n`, controller, encoder, converter);
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
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
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

export function goog2oaiStreamResponse(response: Response): Response {
  if (!response.body) {
    return response;
  }

  const transformedStream = goog2oaiStream(response.body);
  const headers = new Headers(response.headers);

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
