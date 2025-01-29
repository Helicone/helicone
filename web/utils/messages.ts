import { StateMessage, HeliconeMessage } from "@/types/prompt-state";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export function isLastMessageUser(messages: StateMessage[]): boolean {
  const lastMessage = messages[messages.length - 1];
  return lastMessage.role === "user";
}

export function isPrefillSupported(provider: string): boolean {
  return provider === "anthropic";
}

export function removeMessagePair(
  messages: StateMessage[],
  index: number
): StateMessage[] {
  // If it's an assistant message followed by a user message, remove both
  if (
    index < messages.length - 1 &&
    messages[index].role === "assistant" &&
    messages[index + 1].role === "user"
  ) {
    return [...messages.slice(0, index), ...messages.slice(index + 2)];
  }
  // If it's a single assistant message (prefill), just remove it
  else return [...messages.slice(0, index), ...messages.slice(index + 1)];
}

export function inferMessageRole(
  hasSystemStart: boolean,
  messageIndex: number
): "user" | "assistant" {
  const adjustedIndex = hasSystemStart ? messageIndex - 1 : messageIndex;
  return adjustedIndex % 2 === 0 ? "user" : "assistant";
}

export function heliconeToStateMessages(
  messages: HeliconeMessage[]
): StateMessage[] {
  // First determine if we have a system/developer message at the start
  let hasSystemStart = false;
  if (messages.length > 0 && typeof messages[0] !== "string") {
    hasSystemStart =
      (messages[0] as ChatCompletionMessageParam).role === "system" ||
      (messages[0] as ChatCompletionMessageParam).role === "developer";
  }

  return messages.map((message, messageIndex) => {
    // 1. Handle Helicone auto-prompt input string
    if (typeof message === "string") {
      const idxMatch = message.match(/idx=(\d+)/);
      const idx = idxMatch ? parseInt(idxMatch[1]) : undefined;

      return {
        role: inferMessageRole(hasSystemStart, messageIndex),
        content: message,
        idx,
      };
    }

    // 2. Handle direct content
    const baseMessage: StateMessage = {
      role: !("role" in message)
        ? inferMessageRole(hasSystemStart, messageIndex) // Infer role if not present
        : message.role === "function"
        ? "tool" // "function" always becomes "tool"
        : message.role, // Role is present
      content:
        "text" in message // Content is "text"
          ? message.text
          : typeof message.content === "string" // Content is "content"
          ? message.content
          : "", // Content not found directly
    };

    // Handle non-string content (arrays of content parts)
    if ("content" in message && Array.isArray(message.content)) {
      baseMessage.content = (message.content as any[])
        .map((part: any) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && "text" in part)
            return part.text;
          return "";
        })
        .join("");
    }

    // Add toolCallId to state message if present
    if ("tool_call_id" in message && typeof message.tool_call_id === "string") {
      baseMessage.toolCallId = message.tool_call_id;
    } else if (
      "function_call_id" in message &&
      typeof message.function_call_id === "string"
    ) {
      baseMessage.toolCallId = message.function_call_id;
    }

    return baseMessage;
  });
}
