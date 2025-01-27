import { StateMessage, HeliconeMessage } from "@/types/prompt-state";

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

export function heliconeToStateMessages(
  messages: HeliconeMessage[]
): StateMessage[] {
  // First determine if we have a system/developer message at the start
  let hasSystemStart = false;
  if (messages.length > 0 && typeof messages[0] !== "string") {
    hasSystemStart =
      messages[0].role === "system" || messages[0].role === "developer";
  }

  return messages.map((message, arrayIndex) => {
    // Handle Helicone auto-prompt input string
    if (typeof message === "string") {
      const idxMatch = message.match(/idx=(\d+)/);
      const idx = idxMatch ? parseInt(idxMatch[1]) : undefined;

      // If we had a system/developer start, shift the alternating pattern by 1
      const adjustedIndex = hasSystemStart ? arrayIndex - 1 : arrayIndex;
      return {
        role: adjustedIndex % 2 === 0 ? "user" : "assistant",
        content: message,
        idx,
      };
    }

    // At this point, message is ChatCompletionMessageParam
    const baseMessage: StateMessage = {
      role:
        message.role === "function"
          ? "tool"
          : (message.role as StateMessage["role"]), // Type assertion since we know these align
      content: typeof message.content === "string" ? message.content : "",
    };

    // Handle tool/function calls
    if ("tool_call_id" in message && typeof message.tool_call_id === "string") {
      baseMessage.toolCallId = message.tool_call_id;
    } else if (
      "function_call_id" in message &&
      typeof message.function_call_id === "string"
    ) {
      baseMessage.toolCallId = message.function_call_id;
    }

    // Handle non-string content (arrays of content parts)
    if (Array.isArray(message.content)) {
      baseMessage.content = message.content
        .map((part: any) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && "text" in part)
            return part.text;
          return "";
        })
        .join("");
    }

    return baseMessage;
  });
}
