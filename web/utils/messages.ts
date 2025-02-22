import { Message } from "packages/llm-mapper/types";

export function isLastMessageUser(messages: Message[]): boolean {
  const lastMessage = messages[messages.length - 1];
  return lastMessage.role === "user";
}

export function isPrefillSupported(provider: string): boolean {
  return provider === "ANTHROPIC";
}

export interface MessageRemovalOptions {
  isPrefillSupported: boolean;
  messages: Message[];
  index: number;
}
export function getMessagesToRemove({
  isPrefillSupported,
  messages,
  index,
}: MessageRemovalOptions): number[] {
  // First system and user messages are not removable
  if (index <= 1) return [];

  // For providers that support prefill, just remove the single message if it's a user message
  if (isPrefillSupported && messages[index].role === "user") {
    return [index];
  }

  // For providers that don't support prefill, we need to handle message pairs
  // If it's a user message preceded by an assistant message, remove both messages
  if (
    index > 0 &&
    messages[index].role === "user" &&
    messages[index - 1]?.role === "assistant"
  ) {
    return [index - 1, index];
  }

  // If it's an assistant message followed by a user message, remove both
  if (
    index < messages.length - 1 &&
    messages[index].role === "assistant" &&
    messages[index + 1].role === "user"
  ) {
    return [index, index + 1];
  }

  // If it's a single assistant message (prefill), just remove it
  return [index];
}

export function removeMessage({
  isPrefillSupported,
  messages,
  index,
}: MessageRemovalOptions): Message[] {
  const indicesToRemove = getMessagesToRemove({
    isPrefillSupported,
    messages,
    index,
  });
  if (indicesToRemove.length === 0) return messages;

  return messages.filter((_, i) => !indicesToRemove.includes(i));
}

export function inferMessageRole(
  hasSystemStart: boolean,
  messageIndex: number
): "user" | "assistant" {
  const adjustedIndex = hasSystemStart ? messageIndex - 1 : messageIndex;
  return adjustedIndex % 2 === 0 ? "user" : "assistant";
}

// TODO: Streamline and improve this util
export function parseImprovedMessages(input: string): Message[] {
  const messages: Message[] = [];
  let currentContent = "";
  let currentRole: Message["role"] | null = null;

  // Helper to map tag names to StateMessage roles
  const tagToRole = (tag: string): Message["role"] | null => {
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
              _type: "message",
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
      _type: "message",
      role: currentRole,
      content: cleanContent(currentContent),
    });
  }

  return messages;
}
