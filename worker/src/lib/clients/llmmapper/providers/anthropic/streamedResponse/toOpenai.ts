import { AnthropicStreamEvent } from "./types";
import {
  OpenAIStreamEvent,
  ChatCompletionChunk,
  Choice,
} from "../../openai/streamedResponse/types";

export function toOpenAI(
  event: AnthropicStreamEvent
): OpenAIStreamEvent | null {
  const baseChunk: ChatCompletionChunk = {
    id: "",
    object: "chat.completion.chunk",
    created: Math.floor(Date.now() / 1000),
    model: "",
    system_fingerprint: "",
    choices: [],
  };

  switch (event.type) {
    case "message_start":
      return {
        ...baseChunk,
        id: event.message.id,
        model: event.message.model,
        choices: [
          {
            index: 0,
            delta: { role: "assistant" },
            logprobs: null,
            finish_reason: null,
          },
        ],
      };

    case "content_block_delta":
      if (event.delta.type === "text_delta") {
        return {
          ...baseChunk,
          choices: [
            {
              index: 0,
              delta: { content: event.delta.text },
              logprobs: null,
              finish_reason: null,
            },
          ],
        };
      } else {
        // Handle tool use (function call in OpenAI terms)
        return {
          ...baseChunk,
          choices: [
            {
              index: 0,
              delta: {
                function_call: {
                  arguments: event.delta.partial_json,
                },
              },
              logprobs: null,
              finish_reason: null,
            },
          ],
        };
      }

    case "message_delta":
      return {
        ...baseChunk,
        choices: [
          {
            index: 0,
            delta: {},
            logprobs: null,
            finish_reason:
              (event.delta.stop_reason as Choice["finish_reason"]) ?? null,
          },
        ],
        usage: event.usage
          ? {
              prompt_tokens: event.usage.input_tokens ?? 0,
              completion_tokens: event.usage.output_tokens ?? 0,
              total_tokens:
                (event.usage.input_tokens ?? 0) +
                (event.usage.output_tokens ?? 0),
            }
          : undefined,
      };

    case "message_stop":
      return {
        ...baseChunk,
        choices: [
          {
            index: 0,
            delta: {},
            logprobs: null,
            finish_reason: "stop",
          },
        ],
      };

    default:
      // For other event types, return a minimal chunk
      return null;
  }
}
