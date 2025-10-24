import { ChatCompletionChunk } from "@helicone-package/llm-mapper/transform/types/openai";
import { ChatToResponsesStreamConverter } from "@helicone-package/llm-mapper/transform/providers/responses/streamedResponse/toResponses";

/**
 * Transform an OpenAI Chat Completions SSE stream into
 * an OpenAI Responses API SSE stream.
 */
export function oaiChat2responsesStream(
  stream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const converter = new ChatToResponsesStreamConverter();

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();
      let buffer = "";
      let emittedCompleted = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (!value) continue;

          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split("\n\n");
          buffer = messages.pop() ?? "";

          for (const message of messages) {
            if (!message.trim()) continue;
            const line = message.trim();

            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data.trim() === "[DONE]") {
                // Ensure stream termination; Responses API may end with response.completed
                if (!emittedCompleted) {
                  // If the converter hasn't emitted a response.completed (e.g., no usage)
                  // we just end the stream. Clients also listen for "event: done".
                  controller.enqueue(encoder.encode("event: done\n\n"));
                }
                continue;
              }

              try {
                const chunk = JSON.parse(data) as ChatCompletionChunk;
                console.log("chunk", JSON.stringify(chunk, null, 2));
                const events = converter.convert(chunk);
                for (const ev of events) {
                  const type = (ev as any).type;
                  // Include the type field inside data to match OpenAI SDK expectations
                  const sseMessage = `event: ${type}\n` +
                    `data: ${JSON.stringify(ev)}\n\n`;
                  controller.enqueue(encoder.encode(sseMessage));
                  if (type === "response.completed") {
                    emittedCompleted = true;
                  }
                }
              } catch (e) {
                // skip invalid json
              }
            }
            // ignore comments (lines starting with ':') and any 'event:' lines
          }
        }

        // Close stream
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });
}

// Response wrapper that adjusts headers and pipes transformed stream
export function oaiChat2responsesStreamResponse(response: Response): Response {
  if (!response.body) {
    return response;
  }

  const transformed = oaiChat2responsesStream(response.body);
  const headers = new Headers(response.headers);
  headers.set("content-type", "text/event-stream; charset=utf-8");
  headers.set("cache-control", "no-cache");
  headers.set("connection", "keep-alive");
  headers.delete("content-length");

  return new Response(transformed, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
