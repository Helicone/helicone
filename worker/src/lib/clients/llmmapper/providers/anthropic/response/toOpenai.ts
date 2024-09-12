import { OpenAIResponseBody, Choice } from "../../openai/response/types";
import { AntResponseBody, ContentBlock } from "./types";

export function toOpenAI(response: AntResponseBody): OpenAIResponseBody {
  const content = response.content
    .map((block) => blockToString(block))
    .join("");

  const choice: Choice = {
    index: 0,
    message: {
      role: "assistant",
      content: content,
    },
    finish_reason: mapStopReason(response.stop_reason),
    logprobs: null,
  };

  return {
    id: response.id,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000), // Current timestamp in seconds
    model: response.model,
    choices: [choice],
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

function blockToString(block: ContentBlock): string {
  if (block.type === "text") {
    return block.text || "";
  } else if (block.type === "tool_use") {
    return `Tool used: ${block.name}\nInput: ${JSON.stringify(block.input)}\n`;
  }
  return "";
}

function mapStopReason(
  reason: AntResponseBody["stop_reason"]
): Choice["finish_reason"] {
  switch (reason) {
    case "end_turn":
    case "stop_sequence":
      return "stop";
    case "max_tokens":
      return "length";
    case "tool_use":
      return "tool_calls";
    default:
      return null;
  }
}
