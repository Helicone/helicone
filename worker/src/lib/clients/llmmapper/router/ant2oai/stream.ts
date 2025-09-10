import { toOpenAI as toOpenAIStreamed } from "../../providers/anthropic/streamedResponse/toOpenai";
import { AnthropicStreamEvent } from "../../providers/anthropic/streamedResponse/types";

export function ant2oaiStream(
  stream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              processBuffer(buffer, controller, encoder);
            }
            // Send the final [DONE] message
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            break;
          }

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages (separated by double newlines)
          const messages = buffer.split("\n\n");
          
          // Keep the last incomplete message in the buffer
          buffer = messages.pop() || "";
          
          // Process complete messages
          for (const message of messages) {
            if (message.trim()) {
              processBuffer(message + "\n\n", controller, encoder);
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

function processBuffer(
  buffer: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
) {
  // Split by lines to find data lines
  const lines = buffer.split("\n");
  
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        const jsonStr = line.slice(6);
        
        // Skip the [DONE] message from Anthropic
        if (jsonStr.trim() === "[DONE]") {
          continue;
        }
        
        const anthropicEvent: AnthropicStreamEvent = JSON.parse(jsonStr);
        const openAIEvent = toOpenAIStreamed(anthropicEvent);
        
        if (openAIEvent) {
          const sseMessage = `data: ${JSON.stringify(openAIEvent)}\n\n`;
          controller.enqueue(encoder.encode(sseMessage));
        }
      } catch (error) {
        // Skip malformed JSON
        console.error("Failed to parse SSE data:", error);
      }
    } else if (line.startsWith("event:") || line.startsWith(":")) {
      // Skip event type lines and comments
      continue;
    }
  }
}

export function ant2oaiStreamResponse(response: Response): Response {
  if (!response.body) {
    return response;
  }

  const transformedStream = ant2oaiStream(response.body);
  
  return new Response(transformedStream, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
      "connection": "keep-alive",
    },
  });
}