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

// TODO: Streamline and improve this util
export function parseImprovedMessages(input: string): StateMessage[] {
  const messages: StateMessage[] = [];
  let currentContent = "";
  let currentRole: StateMessage["role"] | null = null;

  // Helper to map tag names to StateMessage roles
  const tagToRole = (tag: string): StateMessage["role"] | null => {
    if (!tag.startsWith("improved_")) return null;
    const role = tag.replace("improved_", "");
    if (role === "system") return "system";
    if (role === "user") return "user";
    if (role === "assistant") return "assistant";
    if (role === "tool") return "tool";
    if (role === "developer") return "developer";
    return null;
  };

  // Helper to clean content by removing closing improved_ tags
  const cleanContent = (content: string): string => {
    return content
      .replace(/<\/improved_(system|user|assistant|tool|developer)>/g, "")
      .trim();
  };

  // Process the input character by character
  let i = 0;
  while (i < input.length) {
    if (input[i] === "<") {
      // Look for the end of the tag
      const tagEnd = input.indexOf(">", i);
      if (tagEnd === -1) {
        // No closing bracket found, treat rest as content
        if (currentRole) {
          currentContent += input.slice(i);
        }
        break;
      }

      const tag = input.slice(i + 1, tagEnd);

      // Only process if it's not a closing tag
      if (!tag.startsWith("/")) {
        const newRole = tagToRole(tag);
        // If we found a new valid improved_ tag
        if (newRole !== null) {
          // Save previous message if we had one
          if (currentRole && currentContent) {
            messages.push({
              role: currentRole,
              content: cleanContent(currentContent),
            });
          }
          // Start new message
          currentRole = newRole;
          currentContent = "";
        } else if (currentRole) {
          // If it's not a valid improved_ tag but we're in a message, treat as content
          currentContent += input.slice(i, tagEnd + 1);
        }
      } else if (currentRole) {
        // It's a closing tag but we're in a message, check if it's an improved_ closing tag
        if (!tag.startsWith("/improved_")) {
          // Only add non-improved closing tags to content
          currentContent += input.slice(i, tagEnd + 1);
        }
      }
      i = tagEnd + 1;
    } else {
      // If we're inside a role definition, accumulate content
      if (currentRole) {
        currentContent += input[i];
      }
      i++;
    }
  }

  // Handle any remaining content
  if (currentRole && currentContent) {
    messages.push({
      role: currentRole,
      content: cleanContent(currentContent),
    });
  }

  return messages;
}
