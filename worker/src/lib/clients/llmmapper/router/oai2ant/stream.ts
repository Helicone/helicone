import { AnthropicToOpenAIStreamConverter } from "@helicone-package/llm-mapper/transform/providers/anthropic/streamedResponse/toOpenai";
import { toAnthropic } from "@helicone-package/llm-mapper/transform/providers/openai/request/toAnthropic";
import { HeliconeChatCreateParams } from "@helicone-package/prompts/types";

// transform the readable stream from Anthropic SSE to OpenAI SSE format
export function oai2antStream(
  stream: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const converter = new AnthropicToOpenAIStreamConverter();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = stream.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            if (buffer.trim()) {
              processBuffer(buffer, controller, encoder, converter);
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
              processBuffer(message + "\n\n", controller, encoder, converter);
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
  encoder: TextEncoder,
  converter: AnthropicToOpenAIStreamConverter
) {
  converter.processLines(buffer, (chunk) => {
    const sseMessage = `data: ${JSON.stringify(chunk)}\n\n`;
    controller.enqueue(encoder.encode(sseMessage));
  });
}

// Anthro SSE Response to OpenAI SSE Response
export function oai2antStreamResponse(response: Response): Response {
  if (!response.body) {
    return response;
  }

  const transformedStream = oai2antStream(response.body);

  return new Response(transformedStream, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}

export async function oaiStream2antStream({
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

    return oai2antStreamResponse(response);
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
